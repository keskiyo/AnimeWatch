from src.config import get_settings
from datetime import UTC, datetime

from src.db.anime_catalog import save_anime_detail
from src.db.anime_catalog_queries import get_anime_catalog_by_id
from src.logger import get_logger
from src.models import Anime
from src.services.catalog_filter import filter_anime_catalog
from src.services.shikimori import (
    fetch_shikimori_anime,
    fetch_shikimori_anime_by_studio,
    fetch_shikimori_bulk_catalog,
    fetch_shikimori_catalog,
    fetch_shikimori_related,
    get_cache,
)
from src.services.yummyanime import fetch_yummyanime_description

log = get_logger(__name__)


async def get_anime_catalog(query: dict[str, str | None]) -> dict:
    try:
        return await fetch_shikimori_catalog(query, get_settings())
    except Exception as error:
        log.error("catalog fetch: %s", error)
        raise


async def get_bulk_anime_catalog() -> dict:
    """
    Return the full catalog from the local anime_catalog table. If the table is
    empty the response carries needs_sync=true.
    """
    items = await fetch_shikimori_bulk_catalog(get_settings())
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
        catalog = await fetch_shikimori_bulk_catalog(get_settings())
        by_id = {item["id"]: item for item in catalog}
        items = [by_id[i] for i in ids if i in by_id]
        return {"data": items, "total": len(items), "translation_id": translation_id}
    except Exception as error:
        log.error("get_dubbing_anime %d: %s", translation_id, error)
        return {"data": [], "total": 0, "translation_id": translation_id}


async def get_studio_anime(studio_name: str) -> dict:
    """Return all anime for a studio."""
    try:
        items = await fetch_shikimori_anime_by_studio(studio_name, get_settings())
        return {"data": items, "total": len(items), "studio": studio_name}
    except Exception as error:
        log.error("get_studio_anime %r: %s", studio_name, error)
        return {"data": [], "total": 0, "studio": studio_name}


async def get_anime_related(anime_id: int) -> list[dict]:
    """Return related anime (sequels, prequels, etc.) for anime_id."""
    try:
        return await fetch_shikimori_related(anime_id, get_settings())
    except Exception as error:
        log.warning("related %d: %s", anime_id, error)
        return []


_DETAIL_TTL_SECONDS = 24 * 3600


def _detail_is_fresh(anime: Anime) -> bool:
    """True when the local row already holds detail data younger than 24 h."""
    detailed_at = anime.get("detailed_at")  # type: ignore[typeddict-item]
    if not detailed_at:
        return False
    try:
        saved = datetime.fromisoformat(str(detailed_at))
    except ValueError:
        return False
    return (datetime.now(tz=UTC) - saved).total_seconds() < _DETAIL_TTL_SECONDS


async def get_anime_by_id(anime_id: int) -> Anime | None:
    """Anime detail, DB-first:

    1. Local anime_catalog row with fresh detail data (<24 h) → instant, no
       external calls at all.
    2. Otherwise: Shikimori (description included) → YummyAnime only as the
       last resort for a missing description → SAVE the full detail payload
       (roles, screenshots, source) into anime_catalog.
    3. Shikimori unreachable → serve whatever the local row has.
    """
    env = get_settings()
    local = get_anime_catalog_by_id(env.database_path, anime_id)
    if local is not None and _detail_is_fresh(local):
        return local

    try:
        anime = await fetch_shikimori_anime(anime_id, env)
        if anime is None:
            return local

        if not (anime.get("description") or "").strip():
            desc = await fetch_yummyanime_description(
                shikimori_id=anime["id"],
                title_ru=anime.get("title_ru") or "",
                title_en=anime.get("title_en") or "",
                mal_id=anime.get("mal_id"),
                endpoint=env.yummyanime_endpoint,
                token=env.yummyanime_token,
                cache=get_cache(env),
            )
            if desc:
                anime["description"] = desc  # type: ignore[typeddict-unknown-key]

        # Persist EVERYTHING the page needs — next visit is served from SQLite
        save_anime_detail(env.database_path, anime)
        return anime
    except Exception as error:
        log.error("anime detail %d: %s", anime_id, error)
        return local  # Shikimori down — local row beats nothing
