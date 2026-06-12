"""AnimegoParserAsync singleton + throttled wrappers.

AnimeGO bans aggressive clients: every outgoing call waits on a 1 rps
throttle, and the parser's own page cache is enabled (10 h TTL).
"""

from typing import Any

from anime_parsers_ru import AnimegoParserAsync

from src.config import Settings, get_settings
from src.services.shikimori.rate_limit import Throttle

animego_throttle = Throttle(1.0)

_parser: AnimegoParserAsync | None = None


def get_parser(settings: Settings | None = None) -> AnimegoParserAsync:
    global _parser
    if _parser is None:
        env = settings or get_settings()
        _parser = AnimegoParserAsync(
            mirror=env.animego_mirror,
            proxy=env.animego_proxy,
            use_cache=True,
            cache_maxsize=300,
            cache_ttl=36000,
        )
    return _parser


async def search(query: str) -> list[dict]:
    await animego_throttle.wait()
    result = await get_parser().search(query)
    return result if isinstance(result, list) else []


async def get_voices(animego_id: str, episode: int) -> dict:
    await animego_throttle.wait()
    result = await get_parser().get_voices(animego_id, episode)
    return result if isinstance(result, dict) else {}


async def aniboom_stream_for_voice(
    translation_id: str, episode: int, animego_id: str
) -> dict:
    await animego_throttle.wait()
    result = await get_parser().aniboom_get_stream_for_voice(
        translation_id, episode, animego_id
    )
    return result if isinstance(result, dict) else {}


async def cvh_playlist(cvh_id: str) -> dict:
    await animego_throttle.wait()
    result = await get_parser().cvh_get_playlist(cvh_id)
    return result if isinstance(result, dict) else {}


async def cvh_stream_by_id(vk_id: str) -> dict:
    await animego_throttle.wait()
    result = await get_parser().cvh_get_stream_by_id(vk_id)
    return result if isinstance(result, dict) else {}
