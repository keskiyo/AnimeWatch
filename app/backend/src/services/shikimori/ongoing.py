"""Currently ongoing anime (feeds /api/schedule and the home rail)."""

import asyncio
from datetime import UTC, datetime

from src.config import Settings, get_settings
from src.logger import get_logger
from src.models import Anime
from src.services.shikimori.fields import GQL_LIST_FIELDS
from src.services.shikimori.helpers import get_cache
from src.services.shikimori.http import fetch_gql, to_gql_order
from src.services.shikimori.normalizers import normalize_shikimori_gql_anime
from src.services.shikimori.posters import (
    enrich_missing_posters,
    enrich_missing_posters_rest,
)

log = get_logger(__name__)

_ONGOING_CACHE_KEY = "shikimori:ongoing:gql:v1"
_ONGOING_CACHE_TTL = 3600
_ONGOING_PAGE_LIMIT = 50
_ONGOING_MAX_PAGES = 10


async def fetch_shikimori_ongoing(settings: Settings | None = None) -> list[Anime]:
    """
    Return all currently ongoing anime via GraphQL (includes nextEpisodeAt).
    SQLite-cached 1 h; serves stale cache if Shikimori is unreachable.
    """
    env = settings or get_settings()
    cache = get_cache(env)

    cached = cache.get_json(_ONGOING_CACHE_KEY)
    if cached and cached[1]:
        return cached[0]  # type: ignore[return-value]

    now_iso = datetime.now(tz=UTC).isoformat()
    items: list[Anime] = []
    ongoing_order = to_gql_order("popularity")
    try:
        for page in range(1, _ONGOING_MAX_PAGES + 1):
            log.debug(
                "[ongoing-gql] page=%d limit=%d order=%s",
                page,
                _ONGOING_PAGE_LIMIT,
                ongoing_order,
            )
            query = (
                '{ animes(status: "ongoing", order: %s, page: %d, limit: %d) { %s } }'
                % (
                    ongoing_order,
                    page,
                    _ONGOING_PAGE_LIMIT,
                    GQL_LIST_FIELDS,
                )
            )
            data = await fetch_gql(query, env)
            raw_list = (data or {}).get("animes") or []
            for raw in raw_list:
                try:
                    anime = normalize_shikimori_gql_anime(raw, now_iso)
                    if not anime.get("poster_url"):
                        log.debug(
                            "[ongoing-poster] missing poster id=%s title=%r raw=%r",
                            anime.get("id"),
                            anime.get("title_ru"),
                            raw.get("poster"),
                        )
                    items.append(anime)
                except Exception:
                    continue
            if len(raw_list) < _ONGOING_PAGE_LIMIT:
                break
            await asyncio.sleep(0.3)
    except Exception as exc:
        log.error("[ongoing-gql] fetch failed: %s", exc)
        if cached:
            return cached[0]  # stale cache beats no data
        raise

    seen: set[int] = set()
    unique: list[Anime] = []
    for anime in items:
        if anime["id"] not in seen:
            seen.add(anime["id"])
            unique.append(anime)

    await enrich_missing_posters(unique, env, cache)
    await enrich_missing_posters_rest(unique, env, cache)

    cache.set_json(_ONGOING_CACHE_KEY, unique, _ONGOING_CACHE_TTL)
    return unique
