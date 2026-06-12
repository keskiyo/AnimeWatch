"""Player and schedule routes."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from src.config import get_settings
from src.logger import get_logger
from src.services.animego import (
    get_animego_availability,
    get_animego_stream,
    get_animego_voices,
)
from src.services.content import (
    get_studio_anime_availability,
    get_studios,
)
from src.services.schedule import get_schedule
from src.services.kodik import get_kodik_player

log = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["player"])


@router.get("/player/kodik/{anime_id}/{episode}")
async def kodik_player(anime_id: int, episode: int) -> dict:
    return await get_kodik_player(anime_id, episode)


@router.get("/player/animego/{anime_id}/{episode}")
async def animego_voices(anime_id: int, episode: int) -> dict:
    """Backup player: aniboom/cvh voices available for the episode."""
    return await get_animego_voices(anime_id, episode)


@router.get("/player/animego/stream/{anime_id}/{episode}")
async def animego_stream(
    anime_id: int,
    episode: int,
    voice: str,
    type: str,
) -> dict:
    """Stream source (HLS url / MP4 list) for a chosen AnimeGO voice."""
    if type not in ("aniboom", "cvh"):
        raise HTTPException(status_code=422, detail="type must be aniboom or cvh")
    return await get_animego_stream(anime_id, episode, voice, type)


@router.get("/player/providers/{anime_id}")
async def player_providers(anime_id: int) -> dict:
    """Which players can serve this anime (kodik primary, animego backup)."""
    kodik = await get_kodik_player(anime_id, 1)
    animego_available = await get_animego_availability(anime_id)
    return {
        "providers": [
            {"id": "kodik", "label": "Kodik", "kind": "iframe",
             "available": bool(kodik.get("available"))},
            {"id": "animego", "label": "AnimeGO", "kind": "stream",
             "available": animego_available},
        ]
    }


@router.get("/schedule")
async def schedule(
    days: Annotated[int, Query(ge=1, le=30)] = 7, studio: str | None = None
) -> dict:
    try:
        return await get_schedule(days, studio)
    except Exception as exc:
        log.error("/api/schedule error: %s", exc)
        raise HTTPException(
            status_code=503, detail="Schedule temporarily unavailable"
        ) from exc


@router.get("/studios")
def studios() -> list[dict]:
    return get_studios(bool(get_settings().kodik_api_key))


@router.get("/studios/{name}/animes/{anime_id}")
async def studio_anime_availability(name: str, anime_id: int) -> dict:
    return await get_studio_anime_availability(name, anime_id)
