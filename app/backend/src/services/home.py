"""Home page data assembled from local catalog rows."""

from src.db.anime_catalog_home import get_home_season_anime
from src.models import Anime


async def get_home_season(limit: int) -> list[Anime]:
    safe_limit = min(max(limit, 1), 30)
    return await get_home_season_anime(safe_limit)
