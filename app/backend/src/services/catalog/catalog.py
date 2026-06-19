from src.config import get_settings

from src.db.anime_catalog_lookup import get_anime_catalog_by_studio
from src.db.anime_catalog_queries import (
    get_anime_catalog_all,
    get_anime_catalog_by_id,
    get_anime_catalog_page,
)
from src.logger import get_logger
from src.models import Anime
from src.services.catalog.catalog_related import merge_related_with_catalog_family
from src.services.shikimori import get_cache
from src.services.shikimori.normalizers import normalize_related

log = get_logger(__name__)


async def get_anime_catalog(query: dict[str, str | None]) -> dict:
    """Read a filtered catalog page from the local `anime` collection."""
    try:
        return await get_anime_catalog_page(query)
    except Exception as error:
        log.error("catalog query: %s", error)
        raise


async def get_bulk_anime_catalog() -> dict:
    """
    Return the full catalog from the local `anime` collection. If it is empty the
    response carries needs_sync=true.
    """
    items = await get_anime_catalog_all()
    result = {"data": items, "total": len(items)}
    if not items:
        result["needs_sync"] = True
    return result


async def get_dubbing_anime(translation_id: int) -> dict:
    """Return anime voiced by the given Kodik dubbing team."""
    from src.services.kodik import get_dubbing_shikimori_ids

    try:
        ids = await get_dubbing_shikimori_ids(translation_id)
        if not ids:
            return {"data": [], "total": 0, "translation_id": translation_id}
        catalog = await get_anime_catalog_all()
        by_id = {item["id"]: item for item in catalog}
        items = [by_id[i] for i in ids if i in by_id]
        return {"data": items, "total": len(items), "translation_id": translation_id}
    except Exception as error:
        log.error("get_dubbing_anime %d: %s", translation_id, error)
        return {"data": [], "total": 0, "translation_id": translation_id}


async def get_studio_anime(studio_name: str) -> dict:
    """Return all anime for a studio from the local catalog."""
    items = await get_anime_catalog_by_studio(studio_name)
    return {"data": items, "total": len(items), "studio": studio_name}


async def get_anime_related(anime_id: int) -> list[dict]:
    """Return related anime from cache and local catalog, without external calls."""
    env = get_settings()
    cached = await get_cache().get_json(f"shikimori:anime:related:{anime_id}")
    related = normalize_related(cached[0], env.shikimori_endpoint) if cached else []
    return await merge_related_with_catalog_family(anime_id, related)


async def get_anime_by_id(anime_id: int) -> Anime | None:
    """Anime detail from the local `anime` collection only."""
    return await get_anime_catalog_by_id(anime_id)
