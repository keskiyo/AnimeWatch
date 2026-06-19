"""Related anime (sequels, prequels, …) via REST, with stale-cache fallback."""

from src.config import Settings, get_settings
from src.logger import get_logger
from src.services.shikimori.helpers import get_cache
from src.services.shikimori.http import fetch_rest_json
from src.services.shikimori.normalizers import normalize_related

log = get_logger(__name__)

_RELATED_TTL = 86400


async def fetch_shikimori_related(
    anime_id: int, settings: Settings | None = None
) -> list[dict]:
    if anime_id <= 0:
        return []
    env = settings or get_settings()
    cache = get_cache(env)
    key = f"shikimori:anime:related:{anime_id}"

    cached = await cache.get_json(key)
    if cached and cached[1]:  # fresh
        return normalize_related(cached[0], env.shikimori_endpoint)

    try:
        raw = await fetch_rest_json(f"/api/animes/{anime_id}/related", env)
        await cache.set_json(key, raw, _RELATED_TTL)
        return normalize_related(raw, env.shikimori_endpoint)
    except Exception as exc:
        # Shikimori unreachable (e.g. ConnectError) — expired cache beats nothing
        log.warning("[related] %d fetch failed: %s — serving stale cache", anime_id, exc)
        if cached:
            return normalize_related(cached[0], env.shikimori_endpoint)
        raise
