"""Public AnimeGO service: voices per episode, stream urls, availability."""

from src.config import Settings, get_settings
from src.db.cache import get_cached_json
from src.logger import get_logger
from src.services.animego.client import (
    aniboom_stream_for_voice,
    cvh_playlist,
    cvh_stream_by_id,
    get_voices,
)
from src.services.animego.normalize import (
    find_cvh_vk_id,
    normalize_aniboom_stream,
    normalize_cvh_stream,
    normalize_voices,
    unavailable_animego,
)
from src.services.animego.resolver import resolve_animego_id
from src.services.shikimori.helpers import get_cache

log = get_logger(__name__)

_VOICES_TTL = 3600        # voices per episode change rarely
_STREAM_TTL = 900         # stream urls expire — short cache, like Kodik
_AVAILABILITY_TTL = 3600


async def get_animego_voices(
    anime_id: int, episode: int, settings: Settings | None = None
) -> dict:
    """Available aniboom/cvh voices for the episode (cached 1 h)."""
    env = settings or get_settings()
    if anime_id <= 0 or episode <= 0:
        return unavailable_animego("Некорректный запрос")

    animego_id = await resolve_animego_id(anime_id, env)
    if not animego_id:
        return unavailable_animego("Тайтл не найден на AnimeGO")

    cache = get_cache(env)
    key = f"animego:voices:{animego_id}:{episode}"
    cached = cache.get_json(key)
    if cached and cached[1]:
        return cached[0]  # type: ignore[return-value]

    try:
        raw = await get_voices(animego_id, episode)
    except Exception as exc:
        log.warning("[animego] voices %s ep%d failed: %s", animego_id, episode, exc)
        if cached:
            return cached[0]  # stale beats nothing  # type: ignore[return-value]
        return unavailable_animego("AnimeGO временно недоступен")

    result = normalize_voices(raw)
    if result["available"]:  # never cache empty results as success
        cache.set_json(key, result, _VOICES_TTL)
    return result


async def get_animego_stream(
    anime_id: int,
    episode: int,
    stream_ref: str,
    player_type: str,
    settings: Settings | None = None,
) -> dict:
    """StreamSource for a chosen voice: {"kind": "hls"|"mp4"|"unsupported", ...}."""
    env = settings or get_settings()
    cache = get_cache(env)
    key = f"animego:stream:{player_type}:{stream_ref}:{episode}"
    cached = cache.get_json(key)
    if cached and cached[1]:
        return cached[0]  # type: ignore[return-value]

    try:
        if player_type == "aniboom":
            animego_id = await resolve_animego_id(anime_id, env)
            if not animego_id:
                return {"kind": "unsupported"}
            raw = await aniboom_stream_for_voice(stream_ref, episode, animego_id)
            source = normalize_aniboom_stream(raw)
        elif player_type == "cvh":
            playlist = await cvh_playlist(stream_ref)
            vk_id = find_cvh_vk_id(playlist, episode)
            if not vk_id:
                return {"kind": "unsupported"}
            source = normalize_cvh_stream(await cvh_stream_by_id(vk_id))
        else:
            return {"kind": "unsupported"}
    except Exception as exc:
        log.warning("[animego] stream %s/%s failed: %s", player_type, stream_ref, exc)
        return {"kind": "unsupported"}

    if source["kind"] != "unsupported":  # don't cache failures
        cache.set_json(key, source, _STREAM_TTL)
    return source


async def get_animego_availability(
    anime_id: int, settings: Settings | None = None
) -> bool:
    """True when AnimeGO has playable voices for episode 1 (cached 1 h)."""
    env = settings or get_settings()
    try:
        result = await get_cached_json(
            get_cache(env),
            f"animego:available:{anime_id}",
            _AVAILABILITY_TTL,
            lambda: get_animego_voices(anime_id, 1, env),
        )
        return bool(result.get("available"))
    except Exception:
        return False
