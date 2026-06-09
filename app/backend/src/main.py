from typing import Annotated

import httpx
from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from src.config import get_settings
from src.logger import configure_logging, get_logger
from src.services.catalog import get_anime_by_id, get_anime_catalog, get_anime_related, get_bulk_anime_catalog, get_studio_anime

configure_logging()
log = get_logger(__name__)

from src.services.content import (
    get_aniboom_player,
    get_episodes_for_anime,
    get_schedule,
    get_studio_anime_availability,
    get_studios,
)
from src.services.kodik import get_kodik_player
from src.services.library import (
    delete_watchlist_item,
    get_notifications,
    get_progress,
    get_watchlist,
    mark_notification_read,
    merge_settings,
    settings,
    upsert_progress,
    upsert_watchlist_item,
)

env = get_settings()
app = FastAPI(title="AnimeWatch API")

if not env.kodik_api_key:
    log.warning("KODIK_API_KEY not set — video player will be unavailable")

app.add_middleware(
    CORSMiddleware,
    allow_origins=env.frontend_origins,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "runtime": "fastapi"}


# Domains we are willing to proxy images from (Shikimori hotlink protection bypass).
_ALLOWED_IMAGE_HOSTS = (
    "shikimori.one",
    "shikimori.org",
    "desu.shikimori.one",
    "nyaa.shikimori.one",
    "moe.shikimori.one",
)


@app.get("/api/image-proxy")
async def image_proxy(url: str) -> Response:
    """
    Proxy a Shikimori image server-side with a valid Referer/User-Agent.
    Shikimori blocks cross-origin hotlinking and serves a "404" placeholder;
    fetching from the backend (which presents itself as shikimori.one) bypasses that.
    """
    if not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Only https URLs are allowed")
    host = url.split("/", 3)[2].lower()
    if host not in _ALLOWED_IMAGE_HOSTS:
        raise HTTPException(status_code=400, detail="Host not allowed")

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(
                url,
                headers={
                    "User-Agent": env.shikimori_user_agent,
                    "Referer": "https://shikimori.one/",
                    "Accept": "image/avif,image/webp,image/*,*/*",
                },
            )
            resp.raise_for_status()
    except Exception as exc:
        log.warning("image-proxy %s: %s", url, exc)
        raise HTTPException(status_code=502, detail="Image fetch failed") from exc

    return Response(
        content=resp.content,
        media_type=resp.headers.get("content-type", "image/jpeg"),
        headers={"Cache-Control": "public, max-age=604800"},
    )


@app.get("/api/anime")
async def anime_catalog(
    search: str | None = None,
    genre: str | None = None,
    status: str | None = None,
    year: str | None = None,
    season: str | None = None,
    type: str | None = None,
    sort: str | None = None,
    order: str | None = None,
    page: str | None = "1",
    limit: str | None = "24",
) -> dict:
    try:
        return await get_anime_catalog(locals())
    except Exception as exc:
        log.error("/api/anime error: %s", exc)
        raise HTTPException(status_code=503, detail="Catalog service temporarily unavailable") from exc


@app.get("/api/anime/bulk")
async def anime_bulk() -> dict:
    """All anime from 1990+, sorted: ongoing first → year desc. SQLite-cached 24 h."""
    try:
        return await get_bulk_anime_catalog()
    except Exception as exc:
        log.error("/api/anime/bulk error: %s", exc)
        raise HTTPException(status_code=503, detail="Bulk catalog temporarily unavailable") from exc


@app.get("/api/animes/{anime_id}")
async def anime_details(anime_id: int) -> dict:
    anime = await get_anime_by_id(anime_id)
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    return anime


@app.get("/api/studio/{studio_name}/anime")
async def studio_anime_list(studio_name: str) -> dict:
    """All anime produced by *studio_name*, fetched from Shikimori (1 h cache)."""
    return await get_studio_anime(studio_name)


@app.get("/api/animes/{anime_id}/related")
async def anime_related(anime_id: int) -> list[dict]:
    return await get_anime_related(anime_id)


@app.get("/api/animes/{anime_id}/episodes")
def anime_episodes(anime_id: int) -> list[dict]:
    return get_episodes_for_anime(anime_id)


@app.get("/api/schedule")
def schedule(
    days: Annotated[int, Query(ge=1, le=30)] = 7, studio: str | None = None
) -> dict:
    return get_schedule(days, studio)


@app.get("/api/player/kodik/{anime_id}/{episode}")
async def kodik_player(anime_id: int, episode: int) -> dict:
    return await get_kodik_player(anime_id, episode)


@app.get("/api/player/aniboom/{anime_id}/{episode}")
def aniboom_player(anime_id: int, episode: int) -> dict:
    return get_aniboom_player(anime_id, episode)


@app.get("/api/studios")
def studios() -> list[dict]:
    return get_studios(bool(env.kodik_api_key))


@app.get("/api/studios/{name}/animes/{anime_id}")
def studio_anime_availability(name: str, anime_id: int) -> dict:
    return get_studio_anime_availability(name, anime_id)


@app.get("/api/watchlist")
def watchlist() -> list[dict]:
    return get_watchlist()


@app.post("/api/watchlist")
def watchlist_upsert(body: dict = Body(...)) -> dict:
    return upsert_watchlist_item(body)


@app.delete("/api/watchlist/{anime_id}")
def watchlist_delete(anime_id: int) -> dict:
    return delete_watchlist_item(anime_id)


@app.get("/api/progress/{anime_id}")
def progress_for_anime(anime_id: int) -> list[dict]:
    return get_progress(anime_id)


@app.post("/api/progress")
def progress_upsert(body: dict = Body(...)) -> dict:
    return upsert_progress(body)


@app.get("/api/settings")
def current_settings() -> dict:
    return settings


@app.put("/api/settings")
def settings_update(body: dict = Body(default_factory=dict)) -> dict:
    return {"success": True, "settings": merge_settings(body)}


@app.get("/api/notifications")
def notifications(unread_only: str | None = None) -> list[dict]:
    return get_notifications(unread_only == "true")


@app.post("/api/notifications/{notification_id}/read")
def notification_read(notification_id: str) -> dict:
    return mark_notification_read(notification_id)
