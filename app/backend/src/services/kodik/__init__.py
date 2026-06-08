from typing import Any

import httpx
from anime_parsers_ru.parser_kodik_async import KodikParserAsync

from src.config import Settings, get_settings
from src.db.cache import CacheStore, get_cached_json


ALLOWED_PLAYER_HOSTS = {"kodik.info", "kodik.cc", "kodik.biz", "kodik.online", "kodikplayer.com"}
KODIK_CACHE_TTL_SECONDS = 900
_cache_by_path: dict[str, CacheStore] = {}


async def get_kodik_player(anime_id: int, episode_number: int, settings: Settings | None = None) -> dict:
    env = settings or get_settings()
    if anime_id <= 0:
        return unavailable_player("Anime id is invalid")
    if episode_number <= 0:
        return unavailable_player("Episode number is invalid")
    if not env.kodik_api_key:
        return unavailable_player("Kodik token is not configured")

    try:
        response = await get_cached_json(
            _default_cache(env),
            f"kodik:player:{anime_id}",
            KODIK_CACHE_TTL_SECONDS,
            lambda: _fetch_kodik_search(anime_id, env),
        )
        return normalize_kodik_player_result((response.get("results") or [None])[0])
    except Exception:
        return unavailable_player("Kodik is temporarily unavailable")


def unavailable_player(message: str) -> dict:
    return {"available": False, "provider": "kodik", "message": message}


def normalize_kodik_player_result(result: dict[str, Any] | None) -> dict:
    if not result:
        return unavailable_player("Kodik player was not found")

    link = result.get("link")
    if not _is_allowed_url(link):
        return unavailable_player("Kodik player URL is not allowed")

    translation = result.get("translation") if isinstance(result.get("translation"), dict) else {}
    return {
        "available": True,
        "provider": "kodik",
        "link": link,
        "translation": translation.get("title") or "Kodik",
        "quality": result.get("quality") or "auto",
        "episodes_count": _positive_number(result.get("episodes_count")),
        "screenshots": [item for item in result.get("screenshots") or [] if isinstance(item, str) and item.startswith("https://")],
    }


async def _fetch_kodik_search(anime_id: int, settings: Settings) -> dict:
    parser_result = await _fetch_with_anime_parsers(anime_id, settings)
    if parser_result is not None:
        return {"results": parser_result}

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            f"{settings.kodik_endpoint}/search",
            data={
                "token": settings.kodik_api_key,
                "shikimori_id": str(anime_id),
                "types": "anime,anime-serial",
                "with_episodes": "true",
                "limit": "20",
            },
            headers={"Accept": "application/json"},
        )
        response.raise_for_status()
        return response.json()


async def _fetch_with_anime_parsers(anime_id: int, settings: Settings) -> list[dict] | None:
    parser = KodikParserAsync(token=settings.kodik_api_key, validate_token=False)
    try:
        results = await parser.search_by_id(str(anime_id), "shikimori", limit=20)
        return [item for item in results if isinstance(item, dict)]
    except Exception:
        return None
    finally:
        await parser.close_async_session()


def _default_cache(settings: Settings) -> CacheStore:
    if settings.database_path not in _cache_by_path:
        _cache_by_path[settings.database_path] = CacheStore(settings.database_path)
    return _cache_by_path[settings.database_path]


def _is_allowed_url(value: Any) -> bool:
    if not isinstance(value, str) or not value.startswith("https://"):
        return False
    try:
        host = httpx.URL(value).host
    except Exception:
        return False
    return host in ALLOWED_PLAYER_HOSTS


def _positive_number(value: Any) -> int:
    return round(value) if isinstance(value, int | float) and value > 0 else 0
