"""Kodik HTTP transport: search/list fetchers, cache, URL validation."""

from typing import Any

import httpx
from anime_parsers_ru.parser_kodik_async import KodikParserAsync

from src.config import Settings
from src.db.cache import CacheStore

ALLOWED_PLAYER_HOSTS = {
    "kodik.info",
    "kodik.cc",
    "kodik.biz",
    "kodik.online",
    "kodikplayer.com",
}
KODIK_CACHE_TTL_SECONDS = 900

_cache_by_path: dict[str, CacheStore] = {}


def default_cache(settings: Settings) -> CacheStore:
    if settings.database_path not in _cache_by_path:
        _cache_by_path[settings.database_path] = CacheStore(settings.database_path)
    return _cache_by_path[settings.database_path]


async def fetch_kodik_search(anime_id: int, settings: Settings) -> dict:
    # Direct API call first: full raw response, and with_episodes_data gives
    # per-episode dicts with "title" (with_episodes returns bare links only).
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{settings.kodik_endpoint}/search",
                data={
                    "token": settings.kodik_api_key,
                    "shikimori_id": str(anime_id),
                    "types": "anime,anime-serial",
                    "with_episodes_data": "true",
                    "limit": "20",
                },
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            return response.json()
    except Exception:
        # Fallback: anime_parsers_ru (prettified results — no seasons/episode titles)
        parser_result = await _fetch_with_anime_parsers(anime_id, settings)
        if parser_result is not None:
            return {"results": parser_result}
        raise


async def _fetch_with_anime_parsers(
    anime_id: int, settings: Settings
) -> list[dict] | None:
    parser = KodikParserAsync(token=settings.kodik_api_key, validate_token=False)
    try:
        results = await parser.search_by_id(str(anime_id), "shikimori", limit=20)
        return [item for item in results if isinstance(item, dict)]
    except Exception:
        return None
    finally:
        await parser.close_async_session()


async def fetch_kodik_by_translation(translation_id: int, settings: Settings) -> dict:
    """Fetch up to 3 pages of Kodik /list filtered by translation."""
    results: list[dict] = []
    next_page: str | None = None
    async with httpx.AsyncClient(timeout=15) as client:
        for _ in range(3):
            data: dict[str, str] = {
                "token": settings.kodik_api_key or "",
                "translation_id": str(translation_id),
                "types": "anime,anime-serial",
                "limit": "100",
            }
            if next_page:
                data["next"] = next_page
            response = await client.post(
                f"{settings.kodik_endpoint}/list",
                data=data,
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            body = response.json()
            results.extend(
                item for item in body.get("results") or [] if isinstance(item, dict)
            )
            next_page = body.get("next_page")
            if not next_page:
                break
    return {"results": results}


def absolute_link(value: Any) -> Any:
    # Kodik returns protocol-relative links ("//kodik.info/...")
    if isinstance(value, str) and value.startswith("//"):
        return "https:" + value
    return value


def is_allowed_url(value: Any) -> bool:
    if not isinstance(value, str) or not value.startswith("https://"):
        return False
    try:
        host = httpx.URL(value).host
    except Exception:
        return False
    return host in ALLOWED_PLAYER_HOSTS


def positive_number(value: Any) -> int:
    return round(value) if isinstance(value, int | float) and value > 0 else 0
