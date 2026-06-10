"""Anime by production studio (REST list + GQL poster enrichment)."""

import asyncio
from datetime import UTC, datetime
from typing import Any

from src.config import Settings, get_settings
from src.db.cache import CacheStore, get_cached_json
from src.logger import get_logger
from src.models import Anime
from src.services.shikimori.helpers import get_cache
from src.services.shikimori.http import fetch_rest_json
from src.services.shikimori.normalizers import normalize_shikimori_anime
from src.services.shikimori.posters import enrich_missing_posters

log = get_logger(__name__)


async def fetch_shikimori_anime_by_studio(
    studio_name: str, settings: Settings | None = None
) -> list[Anime]:
    env = settings or get_settings()
    cache = get_cache(env)

    studio_id = await _resolve_studio_id(studio_name, env, cache)
    if not studio_id:
        return []

    cache_key = f"shikimori:studio:anime:{studio_id}"
    cached = cache.get_json(cache_key)
    if cached and cached[1]:
        return cached[0]  # type: ignore[return-value]

    all_raw: list[dict[str, Any]] = []
    limit = 50
    for page in range(1, 61):
        try:
            batch = await fetch_rest_json(
                "/api/animes",
                env,
                {
                    "studio": str(studio_id),
                    "limit": str(limit),
                    "page": str(page),
                    "order": "aired_on",
                },
            )
        except Exception as exc:
            log.error("studio %d page %d: %s", studio_id, page, exc)
            break
        if not isinstance(batch, list) or not batch:
            break
        all_raw.extend(batch)
        if len(batch) < limit:
            break
        await asyncio.sleep(0.25)

    now_iso = datetime.now(tz=UTC).isoformat()
    seen: set[int] = set()
    items: list[Anime] = []
    for raw in all_raw:
        try:
            anime = normalize_shikimori_anime(raw, env.shikimori_endpoint, now_iso)
            if anime["id"] not in seen:
                seen.add(anime["id"])
                items.append(anime)
        except Exception:
            continue

    # Enrich poster URLs via GQL for items with missing REST poster
    await enrich_missing_posters(items, env, cache)

    items.sort(
        key=lambda a: (0 if a.get("status") == "ongoing" else 1, -(a.get("year") or 0))
    )
    cache.set_json(cache_key, items, 3600)
    return items


async def _resolve_studio_id(name: str, env: Settings, cache: CacheStore) -> int | None:
    key = f"shikimori:studio:id:{name.lower()}"
    try:
        results = await get_cached_json(
            cache,
            key,
            86400,
            lambda: fetch_rest_json("/api/studios", env, {"search": name, "limit": "10"}),
        )
    except Exception as exc:
        log.error("studio ID lookup %r: %s", name, exc)
        return None

    if not isinstance(results, list):
        return None

    name_lower = name.lower()
    for s in results:
        if isinstance(s, dict) and (s.get("name") or "").lower() == name_lower:
            return int(s["id"])
    if results and isinstance(results[0], dict):
        return int(results[0].get("id", 0)) or None
    return None
