"""Kodik player integration.

Module layout:
  client.py    – HTTP fetchers (/search, /list), cache, URL validation
  normalize.py – raw payload → player dict, translations, episode titles
  dubbing.py   – anime ids by dubbing team
"""

from src.config import Settings, get_settings
from src.db.cache import get_cached_json
from src.logger import get_logger
from src.services.kodik.client import (
    KODIK_CACHE_TTL_SECONDS,
    default_cache,
    fetch_kodik_search,
)
from src.services.kodik.dubbing import get_dubbing_shikimori_ids
from src.services.kodik.normalize import (
    extract_episode_titles,
    extract_translations,
    normalize_kodik_player_result,
    unavailable_player,
)

log = get_logger(__name__)

__all__ = [
    "extract_episode_titles",
    "get_dubbing_shikimori_ids",
    "get_kodik_player",
    "get_kodik_search_results",
    "normalize_kodik_player_result",
    "unavailable_player",
]


async def get_kodik_player(
    anime_id: int, episode_number: int, settings: Settings | None = None
) -> dict:
    env = settings or get_settings()
    if anime_id <= 0:
        return unavailable_player("Anime id is invalid")
    if episode_number <= 0:
        return unavailable_player("Episode number is invalid")
    if not env.kodik_api_key:
        return unavailable_player("Kodik token is not configured")

    try:
        response = await get_cached_json(
            default_cache(env),
            f"kodik:player:v2:{anime_id}",
            KODIK_CACHE_TTL_SECONDS,
            lambda: fetch_kodik_search(anime_id, env),
        )
        results = [r for r in response.get("results") or [] if isinstance(r, dict)]
        player = normalize_kodik_player_result(results[0] if results else None)
        if player.get("available"):
            player["translations"] = extract_translations(results)
        return player
    except Exception as exc:
        log.error("[kodik] anime_id=%d: %s", anime_id, exc)
        return unavailable_player("Kodik is temporarily unavailable")


async def get_kodik_search_results(
    anime_id: int, settings: Settings | None = None
) -> list[dict]:
    """Return raw Kodik search results for *anime_id* (cached). Empty list on any failure."""
    env = settings or get_settings()
    if anime_id <= 0 or not env.kodik_api_key:
        return []
    try:
        response = await get_cached_json(
            default_cache(env),
            f"kodik:player:v2:{anime_id}",
            KODIK_CACHE_TTL_SECONDS,
            lambda: fetch_kodik_search(anime_id, env),
        )
        return [
            item for item in (response.get("results") or []) if isinstance(item, dict)
        ]
    except Exception as exc:
        log.error("[kodik] search anime_id=%d: %s", anime_id, exc)
        return []
