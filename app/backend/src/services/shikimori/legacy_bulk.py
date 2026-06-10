"""Legacy direct-GQL bulk fetch.

Kept ONLY as an explicit fallback (ALLOW_SHIKIMORI_BULK_FALLBACK=true) for
the case when the local anime_catalog table is empty. The normal data path
is the permanent SQLite catalog filled by src/services/shikimori/sync.py.
"""

import asyncio
from datetime import UTC, datetime

from src.config import Settings
from src.logger import get_logger
from src.models import Anime
from src.services.shikimori.fields import GQL_LIST_FIELDS
from src.services.shikimori.helpers import get_cache
from src.services.shikimori.http import fetch_gql, to_gql_order
from src.services.shikimori.normalizers import normalize_shikimori_gql_anime

log = get_logger(__name__)

_BULK_CACHE_KEY = "shikimori:bulk:gql:v3"
_BULK_CACHE_TTL = 86400
_BULK_PAGE_LIMIT = 50
_BULK_MAX_PAGES = 300
_BULK_BATCH_SIZE = 5
_BULK_BATCH_DELAY = 0.5
_BULK_MIN_YEAR = 1990

_BULK_STATUS_RANK = {"ongoing": 0, "released": 1, "announced": 2}


async def legacy_fetch_bulk_from_shikimori(env: Settings) -> list[Anime]:
    """Fetch the 1990+ catalog straight from Shikimori GQL (24h SQLite cache)."""
    cache = get_cache(env)

    cached = cache.get_json(_BULK_CACHE_KEY)
    if cached and cached[1]:
        return cached[0]  # type: ignore[return-value]

    all_items: list[Anime] = []
    now_iso = datetime.now(tz=UTC).isoformat()
    gql_order = to_gql_order("airedOn")

    async def _fetch_page_gql(page: int) -> list[Anime]:
        query = """{
  animes(
    status: "anons,ongoing,released"
    order: %s
    page: %d
    limit: %d
  ) { %s }
}""" % (gql_order, page, _BULK_PAGE_LIMIT, GQL_LIST_FIELDS)
        try:
            data = await fetch_gql(query, env)
            raw_list = (data or {}).get("animes") or []
            result: list[Anime] = []
            for item in raw_list:
                try:
                    a = normalize_shikimori_gql_anime(item, now_iso)
                    if a["year"] >= _BULK_MIN_YEAR:
                        result.append(a)
                except Exception:
                    continue
            return result
        except Exception as exc:
            log.warning("[legacy-bulk] page %d failed: %s", page, exc)
            return []

    first = await _fetch_page_gql(1)
    all_items.extend(first)

    if len(first) >= _BULK_PAGE_LIMIT:
        page = 2
        while page <= _BULK_MAX_PAGES:
            pages = list(range(page, min(page + _BULK_BATCH_SIZE, _BULK_MAX_PAGES + 1)))
            results = await asyncio.gather(*[_fetch_page_gql(p) for p in pages])
            got = 0
            for r in results:
                all_items.extend(r)
                got += len(r)
            if got < len(pages) * _BULK_PAGE_LIMIT:
                break
            page += _BULK_BATCH_SIZE
            await asyncio.sleep(_BULK_BATCH_DELAY)

    seen: set[int] = set()
    unique: list[Anime] = []
    for a in all_items:
        if a["id"] not in seen:
            seen.add(a["id"])
            unique.append(a)

    if not unique:
        raise RuntimeError("legacy bulk catalog fetch returned no anime")

    unique.sort(
        key=lambda a: (
            _BULK_STATUS_RANK.get(str(a.get("status")), 1),
            -(a.get("year") or 0),
        )
    )
    cache.set_json(_BULK_CACHE_KEY, unique, _BULK_CACHE_TTL)
    return unique
