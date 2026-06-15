"""Small catalog reads for the public home page."""

from datetime import datetime

from src.db.anime_catalog import connect, row_to_anime
from src.db.anime_catalog_queries import _KODIK_VISIBLE
from src.models import Anime

LONG_RUNNER_EPISODES = 60

_SEASON_RANK_SQL = (
    "CASE season WHEN 'winter' THEN 0 WHEN 'spring' THEN 1 "
    "WHEN 'summer' THEN 2 WHEN 'fall' THEN 3 ELSE 0 END"
)


def get_home_season_anime(database_path: str, limit: int) -> list[Anime]:
    """Recently-started ongoings for the first screen rail."""
    min_year = datetime.now().year - 1
    rows = connect(database_path).execute(
        f"""
        SELECT *
        FROM anime_catalog
        WHERE status = 'ongoing'
          AND year >= ?
          AND COALESCE(episodes_aired, 0) <= ?
          AND {_KODIK_VISIBLE}
        ORDER BY year DESC, {_SEASON_RANK_SQL} DESC, rating DESC
        LIMIT ?
        """,
        (min_year, LONG_RUNNER_EPISODES, limit),
    ).fetchall()
    return [row_to_anime(row) for row in rows]
