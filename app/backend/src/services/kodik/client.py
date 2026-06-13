"""Kodik HTTP transport: search/list fetchers, cache, URL validation."""

import asyncio
from typing import Any
from urllib.parse import parse_qs, urlparse

import httpx
from anime_parsers_ru.parser_kodik_async import KodikParserAsync

from src.config import Settings
from src.db.cache import CacheStore
from src.services.shikimori.rate_limit import Throttle

# Be polite to Kodik during the full catalog crawl (~5 rps)
_list_throttle = Throttle(0.2)


def _next_token(next_page: Any) -> str | None:
    """Kodik returns `next_page` as a full URL; the usable `next` value is its
    query param. Passing the whole URL back as `next` yields a 500 (bad token)."""
    if not isinstance(next_page, str) or not next_page:
        return None
    if next_page.startswith("http"):
        values = parse_qs(urlparse(next_page).query).get("next")
        return values[0] if values else None
    return next_page

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
            next_page = _next_token(body.get("next_page"))
            if not next_page:
                break
    return {"results": results}


async def iter_kodik_shikimori_ids(settings: Settings) -> set[int]:
    """Every shikimori_id that has a Kodik dubbing (full paginated /list crawl).

    Raises on HTTP error — a partial crawl must NOT be treated as complete,
    otherwise titles we simply didn't reach would be marked as "no dubbing"."""
    ids: set[int] = set()
    next_page: str | None = None
    async with httpx.AsyncClient(timeout=20) as client:
        for _ in range(2000):  # safety bound (~200k titles at 100/page)
            await _list_throttle.wait()
            data: dict[str, str] = {
                "token": settings.kodik_api_key or "",
                "types": "anime,anime-serial",
                "limit": "100",
            }
            if next_page:
                data["next"] = next_page
            body = await _post_list_with_retry(client, settings.kodik_endpoint, data)
            for item in body.get("results") or []:
                if not isinstance(item, dict):
                    continue
                sid = item.get("shikimori_id")
                try:
                    if sid not in (None, ""):
                        ids.add(int(sid))
                except (TypeError, ValueError):
                    continue
            next_page = _next_token(body.get("next_page"))
            if not next_page:
                break
    return ids


async def _post_list_with_retry(
    client: httpx.AsyncClient, endpoint: str, data: dict[str, str]
) -> dict:
    """POST /list, retrying transient 5xx a few times (one blip must not abort
    a multi-hundred-page crawl). Raises if it still fails."""
    last: Exception | None = None
    for attempt in range(3):
        try:
            response = await client.post(
                f"{endpoint}/list", data=data, headers={"Accept": "application/json"}
            )
            if response.status_code >= 500 and attempt < 2:
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            last = exc
            if attempt < 2:
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
            raise
    raise last or RuntimeError("kodik /list failed")


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
