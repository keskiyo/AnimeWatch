"""AnimeGO integration: backup players (aniboom / cvh streams).

Module layout:
  client.py    – AnimegoParserAsync singleton + throttled call wrappers
  resolver.py  – shikimori_id → animego_id (title search + fuzzy match)
  normalize.py – raw get_voices → site player contract
  voices.py    – public API: voices per episode, stream urls, availability
"""

from src.services.animego.voices import (
    get_animego_availability,
    get_animego_stream,
    get_animego_voices,
)

__all__ = [
    "get_animego_availability",
    "get_animego_stream",
    "get_animego_voices",
]
