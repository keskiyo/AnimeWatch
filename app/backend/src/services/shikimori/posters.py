"""Poster enrichment for items whose REST/GQL poster is missing."""

import asyncio

from src.config import Settings
from src.db.cache import CacheStore, get_cached_json
from src.logger import get_logger
from src.models import Anime
from src.services.shikimori.helpers import absolute_url
from src.services.shikimori.http import fetch_gql, fetch_rest_json

log = get_logger(__name__)


async def enrich_missing_posters(
    items: list[Anime], env: Settings, cache: CacheStore
) -> None:
    """For anime whose poster is empty/missing, fetch via GQL in id batches."""
    missing = [a for a in items if not a.get("poster_url")]
    if not missing:
        return
    # Batch into groups of 50 for GQL ids param
    batch_size = 50
    for i in range(0, len(missing), batch_size):
        batch = missing[i : i + batch_size]
        ids_str = ",".join(str(a["id"]) for a in batch)
        query = (
            '{ animes(ids: "%s") { id poster { originalUrl mainUrl previewUrl } } }'
            % ids_str
        )
        try:
            data = await fetch_gql(query, env)
            gql_animes = (data or {}).get("animes") or []
            id_to_poster: dict[int, str] = {}
            for g in gql_animes:
                aid = int(g.get("id") or 0)
                p = g.get("poster") or {}
                url = p.get("originalUrl") or p.get("previewUrl") or ""
                if aid and url:
                    id_to_poster[aid] = url
            for a in batch:
                url = id_to_poster.get(a["id"])
                if url:
                    a["poster_url"] = url
        except Exception as exc:
            log.warning("[enrich-posters] batch failed: %s", exc)
        await asyncio.sleep(0.3)


async def enrich_missing_posters_rest(
    items: list[Anime],
    env: Settings,
    cache: CacheStore,
) -> None:
    """Last-resort poster lookup via the REST detail endpoint, one by one."""
    missing = [a for a in items if not a.get("poster_url")]

    for anime in missing:
        anime_id = anime.get("id")
        if not anime_id:
            continue

        try:
            raw = await get_cached_json(
                cache,
                f"shikimori:anime:rest-poster:{anime_id}",
                86400,
                lambda anime_id=anime_id: fetch_rest_json(
                    f"/api/animes/{anime_id}",
                    env,
                ),
            )

            image = raw.get("image") or {}
            image_url = (
                image.get("original") or image.get("preview") or image.get("x96") or ""
            )

            if image_url and "missing" not in image_url:
                anime["poster_url"] = absolute_url(image_url, env.shikimori_endpoint)

        except Exception as exc:
            log.warning("[rest-poster] failed for anime %s: %s", anime_id, exc)

        await asyncio.sleep(0.15)
