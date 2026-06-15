"""Home page data assembled from local SQLite catalog rows."""

from src.config import get_settings
from src.db.anime_catalog_home import get_home_season_anime
from src.models import Anime


async def get_home_season(limit: int) -> list[Anime]:
    safe_limit = min(max(limit, 1), 30)
    return get_home_season_anime(get_settings().database_path, safe_limit)
