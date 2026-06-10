"""Data collection for catalog sync: id discovery + GQL detail batches.

All requests are sequential behind the shared rate limiter — no bursts.
"""

from typing import Any

from src.config import Settings
from src.logger import get_logger
from src.services.shikimori.fields import GQL_SYNC_FIELDS
from src.services.shikimori.http import fetch_gql, fetch_rest_json
from src.services.shikimori.rate_limit import Throttle

log = get_logger(__name__)

SEASONS = ["winter", "spring", "summer", "fall"]

GQL_BATCH_SIZE = 50
_SEASON_PAGE_LIMIT = 50
_SEASON_MAX_PAGES = 40


async def fetch_shikimori_ids_by_season(
    year: int,
    season: str,
    settings: Settings,
    rate_limiter: Throttle,
) -> list[int]:
    """Collect all anime ids for a season via REST /api/animes paging."""
    ids: list[int] = []
    page = 1

    while page <= _SEASON_MAX_PAGES:
        await rate_limiter.wait()
        raw = await fetch_rest_json(
            "/api/animes",
            settings,
            {
                "season": f"{season}_{year}",
                "limit": str(_SEASON_PAGE_LIMIT),
                "page": str(page),
                "order": "aired_on",
                "censored": "true",
            },
        )

        if not isinstance(raw, list) or not raw:
            break

        for item in raw:
            anime_id = item.get("id")
            if anime_id:
                ids.append(int(anime_id))

        if len(raw) < _SEASON_PAGE_LIMIT:
            break

        page += 1

    return sorted(set(ids))


async def fetch_status_ids(
    statuses: str, settings: Settings, rate_limiter: Throttle
) -> list[int]:
    """Collect ids of all anime with the given GQL statuses (ongoing/anons)."""
    ids: list[int] = []
    page = 1
    while page <= _SEASON_MAX_PAGES:
        await rate_limiter.wait()
        query = '{ animes(status: "%s", order: id_desc, page: %d, limit: 50) { id } }' % (
            statuses,
            page,
        )
        try:
            data = await fetch_gql(query, settings)
        except Exception as exc:
            log.warning("[sync] status ids page %d failed: %s", page, exc)
            break
        raw_list = (data or {}).get("animes") or []
        for item in raw_list:
            try:
                ids.append(int(item["id"]))
            except (KeyError, TypeError, ValueError):
                continue
        if len(raw_list) < 50:
            break
        page += 1
    return sorted(set(ids))


async def fetch_shikimori_gql_animes_by_ids(
    ids: list[int],
    settings: Settings,
    rate_limiter: Throttle,
) -> list[dict[str, Any]]:
    """Fetch raw GQL anime objects for the given ids, in batches of 50."""
    raw_items: list[dict[str, Any]] = []
    for i in range(0, len(ids), GQL_BATCH_SIZE):
        batch = ids[i : i + GQL_BATCH_SIZE]
        ids_str = ",".join(str(anime_id) for anime_id in batch)
        query = '{ animes(ids: "%s", limit: %d) { %s } }' % (
            ids_str,
            len(batch),
            GQL_SYNC_FIELDS,
        )
        await rate_limiter.wait()
        try:
            data = await fetch_gql(query, settings)
        except Exception as exc:
            log.warning("[sync] gql batch of %d ids failed: %s", len(batch), exc)
            continue
        raw_items.extend((data or {}).get("animes") or [])
    return raw_items
