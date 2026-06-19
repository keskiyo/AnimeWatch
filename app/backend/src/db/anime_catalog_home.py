"""Small catalog reads for the public home page."""

from datetime import datetime

from src.db.anime_catalog import doc_to_anime
from src.db.anime_catalog_queries import _KODIK_VISIBLE, _LIGHT_PROJECTION
from src.db.mongo import get_db
from src.models import Anime

LONG_RUNNER_EPISODES = 60
_SEASON_RANK = {"winter": 0, "spring": 1, "summer": 2, "fall": 3}


async def get_home_season_anime(limit: int) -> list[Anime]:
    """Recently-started ongoings for the first-screen rail (not long-runners)."""
    min_year = datetime.now().year - 1
    cursor = get_db().anime.find(
        {
            "$and": [
                {"status": "ongoing"},
                {"year": {"$gte": min_year}},
                {"episodes_aired": {"$lte": LONG_RUNNER_EPISODES}},
                _KODIK_VISIBLE,
            ]
        },
        _LIGHT_PROJECTION,
    )
    items = [doc_to_anime(doc) async for doc in cursor]
    # Sort newest first, season desc within a year, then rating — in Python
    # (small set) to keep the season-rank logic readable.
    items.sort(
        key=lambda a: (
            a.get("year") or 0,
            _SEASON_RANK.get(a.get("season") or "", 0),
            a.get("rating") or 0,
        ),
        reverse=True,
    )
    return items[: max(limit, 0)]
