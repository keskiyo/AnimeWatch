"""shikimori_id → animego_id (AnimeGO knows titles, not Shikimori ids)."""

from difflib import SequenceMatcher

from src.config import Settings, get_settings
from src.db.anime_catalog_queries import get_anime_catalog_by_id
from src.logger import get_logger
from src.services.animego.client import search
from src.services.shikimori.helpers import get_cache

log = get_logger(__name__)

_FOUND_TTL = 30 * 24 * 3600   # resolved ids are stable — 30 days
_MISS_TTL = 24 * 3600         # retry not-found titles daily
_FUZZY_THRESHOLD = 0.85


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def _best_match(results: list[dict], titles: list[str], year: int) -> str | None:
    """Pick the animego id that best matches our titles (exact > fuzzy)."""
    best_id: str | None = None
    best_score = 0.0
    for item in results:
        candidates = [
            str(item.get("title") or ""),
            str(item.get("original_title") or ""),
        ]
        score = max(
            (_similarity(t, c) for t in titles for c in candidates if c),
            default=0.0,
        )
        # Year in the title string is a weak tie-breaker when present
        if year and any(str(year) in c for c in candidates):
            score += 0.05
        if score > best_score:
            best_score = score
            best_id = str(item.get("id") or "") or None
    return best_id if best_score >= _FUZZY_THRESHOLD else None


async def resolve_animego_id(
    shikimori_id: int, settings: Settings | None = None
) -> str | None:
    """Return the animego id (a STRING like '2239') for a Shikimori anime."""
    env = settings or get_settings()
    cache = get_cache(env)
    key = f"animego:resolve:{shikimori_id}"

    cached = cache.get_json(key)
    if cached and cached[1]:
        return cached[0] or None  # "" means "known miss"

    anime = get_anime_catalog_by_id(env.database_path, shikimori_id)
    if not anime:
        return None
    titles = [t for t in (anime.get("title_ru"), anime.get("title_en")) if t]
    if not titles:
        return None

    animego_id: str | None = None
    try:
        for query in titles:
            results = await search(str(query))
            animego_id = _best_match(results, [str(t) for t in titles], anime.get("year") or 0)
            if animego_id:
                break
    except Exception as exc:
        log.warning("[animego] resolve %d failed: %s", shikimori_id, exc)
        return None  # transient failure — do NOT cache

    if animego_id:
        cache.set_json(key, animego_id, _FOUND_TTL)
        log.info("[animego] resolved %d → %s", shikimori_id, animego_id)
    else:
        cache.set_json(key, "", _MISS_TTL)  # honest miss, retry tomorrow
    return animego_id
