from typing import Annotated

from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings
from src.services.catalog import get_anime_by_id, get_anime_catalog, get_bulk_anime_catalog
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
    return await get_anime_catalog(locals())


@app.get("/api/anime/bulk")
async def anime_bulk() -> dict:
    """All anime from 1990+, sorted: ongoing first → year desc. SQLite-cached 24 h."""
    return await get_bulk_anime_catalog()


@app.get("/api/animes/{anime_id}")
async def anime_details(anime_id: int) -> dict:
    anime = await get_anime_by_id(anime_id)
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    return anime


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
