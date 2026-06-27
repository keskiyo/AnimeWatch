"""Anime catalog and detail routes."""

from fastapi import APIRouter, HTTPException

from src.logger import get_logger
from src.services.catalog.catalog import (
    get_anime_by_id,
    get_anime_catalog,
    get_anime_related,
    get_bulk_anime_catalog,
    get_dubbing_anime,
    get_studio_anime,
)
from src.services.content import get_episodes_for_anime

log = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["anime"])


@router.get("/anime")
async def anime_catalog(
    search: str | None = None,
    genre: str | None = None,
    genres: str | None = None,
    status: str | None = None,
    year: str | None = None,
    year_from: str | None = None,
    year_to: str | None = None,
    season: str | None = None,
    type: str | None = None,
    age_rating: str | None = None,
    sort: str | None = None,
    order: str | None = None,
    direction: str | None = None,
    page: str | None = "1",
    limit: str | None = "24",
) -> dict:
    try:
        return await get_anime_catalog(locals())
    except Exception as exc:
        log.error("/api/anime error: %s", exc)
        raise HTTPException(
            status_code=503, detail="Catalog service temporarily unavailable"
        ) from exc


@router.get("/anime/bulk")
async def anime_bulk() -> dict:
    """Full catalog from the local Mongo `anime` collection (no Shikimori calls)."""
    try:
        return await get_bulk_anime_catalog()
    except Exception as exc:
        log.error("/api/anime/bulk error: %s", exc)
        raise HTTPException(
            status_code=503, detail="Bulk catalog temporarily unavailable"
        ) from exc


@router.get("/animes/{anime_id}")
async def anime_details(anime_id: int) -> dict:
    anime = await get_anime_by_id(anime_id)
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    return anime


@router.get("/animes/{anime_id}/related")
async def anime_related(anime_id: int) -> list[dict]:
    return await get_anime_related(anime_id)


@router.get("/animes/{anime_id}/episodes")
async def anime_episodes(anime_id: int) -> list[dict]:
    return await get_episodes_for_anime(anime_id)


@router.get("/studio/{studio_name}/anime")
async def studio_anime_list(studio_name: str) -> dict:
    """All anime produced by *studio_name*, read from the Mongo `anime` collection."""
    return await get_studio_anime(studio_name)


@router.get("/dubbing/{translation_id}/anime")
async def dubbing_anime_list(translation_id: int) -> dict:
    """All anime voiced by the given Kodik dubbing team (translation id)."""
    return await get_dubbing_anime(translation_id)
