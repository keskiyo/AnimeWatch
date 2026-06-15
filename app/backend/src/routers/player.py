"""Player and schedule routes."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from src.config import get_settings
from src.logger import get_logger
from src.services.content import (
    get_studio_anime_availability,
    get_studios,
)
from src.services.home import get_home_season
from src.services.kodik import get_kodik_player
from src.services.schedule import get_schedule

log = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["player"])


@router.get("/player/kodik/{anime_id}/{episode}")
async def kodik_player(anime_id: int, episode: int) -> dict:
    return await get_kodik_player(anime_id, episode)


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


@router.get("/home/season")
async def home_season(limit: Annotated[int, Query(ge=1, le=30)] = 15) -> list[dict]:
    try:
        return await get_home_season(limit)
    except Exception as exc:
        log.error("/api/home/season error: %s", exc)
        raise HTTPException(
            status_code=503, detail="Home season temporarily unavailable"
        ) from exc


@router.get("/studios")
def studios() -> list[dict]:
    return get_studios(bool(get_settings().kodik_api_key))


@router.get("/studios/{name}/animes/{anime_id}")
async def studio_anime_availability(name: str, anime_id: int) -> dict:
    return await get_studio_anime_availability(name, anime_id)
