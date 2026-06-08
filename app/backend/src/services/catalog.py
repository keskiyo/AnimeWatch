from src.config import get_settings
from src.models import Anime
from src.services.mock_data import MOCK_ANIME
from src.services.shikimori import fetch_shikimori_anime, fetch_shikimori_catalog

SORTERS = {
    "rating": lambda item: float(item.get("rating", 0)),
    "date": lambda item: int(item.get("year", 0)),
    "novelty": lambda item: int(item.get("year", 0)),
    "popularity": lambda item: int(item.get("score_count", 0)),
}


async def get_anime_catalog(query: dict[str, str | None]) -> dict:
    try:
        return await fetch_shikimori_catalog(query, get_settings())
    except Exception as error:
        print(f"Shikimori catalog unavailable, using mock catalog: {error}")
        return filter_anime_catalog(MOCK_ANIME, query)


async def get_anime_by_id(anime_id: int) -> Anime | None:
    try:
        return await fetch_shikimori_anime(anime_id, get_settings())
    except Exception as error:
        print(f"Shikimori anime details unavailable, using mock catalog: {error}")
        return next((anime for anime in MOCK_ANIME if anime["id"] == anime_id), None)


def filter_anime_catalog(anime: list[Anime], query: dict[str, str | None]) -> dict:
    search = (query.get("search") or "").strip().lower()
    page = _positive_int(query.get("page"), 1)
    limit = min(_positive_int(query.get("limit"), 24), 50)
    year = _optional_int(query.get("year"))
    sort = query.get("sort") or "popularity"
    order = query.get("order") or "desc"

    filtered = [
        item
        for item in anime
        if _matches(
            item,
            search,
            query.get("genre"),
            query.get("status"),
            year,
            query.get("season"),
            query.get("type"),
        )
    ]
    if sort == "novelty":
        filtered = [item for item in filtered if item.get("status") != "announced"]

    reverse = order != "asc" and sort != "title"
    key = (
        (lambda item: item.get("title_en", ""))
        if sort == "title"
        else SORTERS.get(sort, SORTERS["popularity"])
    )
    sorted_items = sorted(filtered, key=key, reverse=reverse)
    start = (page - 1) * limit
    return {
        "data": sorted_items[start : start + limit],
        "total": len(filtered),
        "page": page,
    }


def _matches(
    item: Anime,
    search: str,
    genre: str | None,
    status: str | None,
    year: int | None,
    season: str | None,
    anime_type: str | None,
) -> bool:
    titles = [
        str(item.get("title_en", "")),
        str(item.get("title_ru", "")),
        str(item.get("title_jp", "")),
    ]
    return (
        (not search or any(search in title.lower() for title in titles))
        and (
            not genre
            or genre.lower() in [value.lower() for value in item.get("genres", [])]
        )
        and (not status or item.get("status") == status)
        and (not year or item.get("year") == year)
        and (not season or item.get("season") == season)
        and (not anime_type or item.get("type") == anime_type)
    )


def _positive_int(value: str | None, fallback: int) -> int:
    parsed = _optional_int(value)
    return parsed if parsed and parsed > 0 else fallback


def _optional_int(value: str | None) -> int | None:
    try:
        return int(value or "")
    except ValueError:
        return None
