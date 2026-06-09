"""
YummyAnime (yani.tv) integration — description fallback when Shikimori has none.

Strategy:
  1. Search by Russian title via GET /anime?q={title_ru}&limit=10
  2. Find result where remote_ids.shikimori_id or remote_ids.myanimelist_id matches
  3. Cache the description 7 days (empty string = "not found, don't retry")
"""

import asyncio
import re
from typing import Any

import httpx

from src.db.cache import CacheStore
from src.logger import get_logger

log = get_logger(__name__)

_CACHE_TTL = 604800  # 7 days


async def fetch_yummyanime_description(
    shikimori_id: int,
    title_ru: str,
    title_en: str,
    mal_id: int | None,
    endpoint: str,
    token: str | None,
    cache: CacheStore,
) -> str:
    """
    Return a Russian description from YummyAnime for the given anime.
    Returns empty string if not found or on error (cached to avoid hammering).
    """
    cache_key = f"yummyanime:desc:{shikimori_id}"
    cached = cache.get_json(cache_key)
    if cached is not None and cached[1]:          # (value, is_fresh)
        return cached[0] or ""

    result = await _search_description(
        shikimori_id, title_ru, title_en, mal_id, endpoint, token
    )

    # Cache even empty results so we don't retry on every request
    cache.set_json(cache_key, result or "", _CACHE_TTL)
    return result or ""


async def _search_description(
    shikimori_id: int,
    title_ru: str,
    title_en: str,
    mal_id: int | None,
    endpoint: str,
    token: str | None,
) -> str | None:
    headers: dict[str, str] = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # Try Russian title first, then English title
    for query in _build_queries(title_ru, title_en):
        try:
            items = await _fetch_search(endpoint, query, headers)
            match = _find_match(items, shikimori_id, mal_id)
            if match:
                desc = (match.get("description") or "").strip()
                if desc:
                    return _clean_description(desc)
        except Exception as exc:
            log.warning("[yummyanime] search %r failed: %s", query, exc)
            await asyncio.sleep(0.5)

    return None


def _build_queries(title_ru: str, title_en: str) -> list[str]:
    queries: list[str] = []
    if title_ru and title_ru.strip():
        queries.append(title_ru.strip())
    if title_en and title_en.strip() and title_en.strip() != title_ru.strip():
        queries.append(title_en.strip())
    return queries


async def _fetch_search(endpoint: str, query: str, headers: dict) -> list[dict]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{endpoint}/anime",
            params={"q": query, "limit": "10"},
            headers=headers,
        )
        resp.raise_for_status()
        data = resp.json()

    # Response format: {"response": [...]} OR directly [...]
    if isinstance(data, dict):
        return data.get("response") or data.get("data") or []
    if isinstance(data, list):
        return data
    return []


def _find_match(
    items: list[dict[str, Any]],
    shikimori_id: int,
    mal_id: int | None,
) -> dict[str, Any] | None:
    for item in items:
        remote = item.get("remote_ids") or {}
        sid = int(remote.get("shikimori_id") or 0)
        mid = int(remote.get("myanimelist_id") or 0)
        if sid and sid == shikimori_id:
            return item
        if mal_id and mid and mid == mal_id:
            return item
    return None


def _clean_description(text: str) -> str:
    """Strip HTML tags and normalize whitespace."""
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text
