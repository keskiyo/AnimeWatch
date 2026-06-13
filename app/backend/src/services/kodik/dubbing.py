"""Anime lists by dubbing team (Kodik /list with translation_id)."""

from src.config import Settings, get_settings
from src.db.cache import get_cached_json
from src.logger import get_logger
from src.services.kodik.client import default_cache, fetch_kodik_by_translation

log = get_logger(__name__)

DUBBING_CACHE_TTL_SECONDS = 21600  # 6 h — dubbing team catalogs change rarely


async def get_dubbing_shikimori_ids(
    translation_id: int, settings: Settings | None = None
) -> list[int]:
    """Return Shikimori ids of anime voiced by *translation_id* (Kodik /list)."""
    env = settings or get_settings()
    if translation_id <= 0 or not env.kodik_api_key:
        return []
    try:
        response = await get_cached_json(
            default_cache(env),
            f"kodik:dubbing:v1:{translation_id}",
            DUBBING_CACHE_TTL_SECONDS,
            lambda: fetch_kodik_by_translation(translation_id, env),
        )
        ids: list[int] = []
        seen: set[int] = set()
        for item in response.get("results") or []:
            if not isinstance(item, dict):
                continue
            raw_id = item.get("shikimori_id")
            try:
                shiki_id = int(raw_id)
            except (TypeError, ValueError):
                continue
            if shiki_id > 0 and shiki_id not in seen:
                seen.add(shiki_id)
                ids.append(shiki_id)
        return ids
    except Exception as exc:
        log.error("[kodik] dubbing translation_id=%d: %s", translation_id, exc)
        return []
