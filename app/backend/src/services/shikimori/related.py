"""Related anime (sequels, prequels, …) via REST."""

from src.config import Settings, get_settings
from src.db.cache import get_cached_json
from src.services.shikimori.helpers import get_cache
from src.services.shikimori.http import fetch_rest_json
from src.services.shikimori.normalizers import normalize_related


async def fetch_shikimori_related(
    anime_id: int, settings: Settings | None = None
) -> list[dict]:
    if anime_id <= 0:
        return []
    env = settings or get_settings()
    raw = await get_cached_json(
        get_cache(env),
        f"shikimori:anime:related:{anime_id}",
        86400,
        lambda: fetch_rest_json(f"/api/animes/{anime_id}/related", env),
    )
    return normalize_related(raw, env.shikimori_endpoint)
