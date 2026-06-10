"""Single anime detail: GQL data + REST roles/screenshots."""

import asyncio
from datetime import UTC, datetime
from typing import Any

from src.config import Settings, get_settings
from src.db.cache import get_cached_json
from src.logger import get_logger
from src.models import Anime
from src.services.shikimori.fields import GQL_ANIME_FIELDS
from src.services.shikimori.helpers import get_cache
from src.services.shikimori.http import fetch_gql_single, fetch_rest_json
from src.services.shikimori.normalizers import (
    merge_roles,
    merge_screenshots,
    normalize_shikimori_gql_anime,
)

log = get_logger(__name__)


async def fetch_shikimori_anime(
    anime_id: int, settings: Settings | None = None
) -> Anime | None:
    """Fetch a single anime by ID. Uses GQL (real posters, genres) + REST for roles/screenshots."""
    if anime_id <= 0:
        return None

    env = settings or get_settings()
    cache = get_cache(env)

    async def _get_gql() -> dict:
        query = '{ animes(ids: "%d") { %s } }' % (anime_id, GQL_ANIME_FIELDS)
        return await get_cached_json(
            cache,
            f"shikimori:gql:anime:v2:{anime_id}",
            env.cache_ttl,
            lambda: fetch_gql_single(query, settings=env),
        )

    async def _get_roles() -> Any:
        try:
            return await get_cached_json(
                cache,
                f"shikimori:anime:roles2:{anime_id}",
                86400,
                lambda: fetch_rest_json(f"/api/animes/{anime_id}/roles", env),
            )
        except Exception as exc:
            log.warning("[roles] fetch failed for anime %d: %s", anime_id, exc)
            return []

    async def _get_screenshots() -> Any:
        try:
            return await get_cached_json(
                cache,
                f"shikimori:anime:screenshots:{anime_id}",
                86400,
                lambda: fetch_rest_json(f"/api/animes/{anime_id}/screenshots", env),
            )
        except Exception as exc:
            log.warning("[screenshots] fetch failed for anime %d: %s", anime_id, exc)
            return []

    gql_raw, raw_roles, raw_screenshots = await asyncio.gather(
        _get_gql(), _get_roles(), _get_screenshots()
    )

    if not gql_raw:
        return None

    now_iso = datetime.now(tz=UTC).isoformat()
    anime = normalize_shikimori_gql_anime(gql_raw, now_iso)
    merge_roles(anime, raw_roles, env.shikimori_endpoint)
    merge_screenshots(anime, raw_screenshots, env.shikimori_endpoint)
    return anime
