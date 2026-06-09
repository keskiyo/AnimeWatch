from src.config import get_settings
from src.models import Anime
from src.services.mock_data import MOCK_ANIME
from src.services.shikimori import fetch_shikimori_anime, fetch_shikimori_catalog

SORTERS: dict[str, object] = {
    "rating": lambda item: float(item.get("rating", 0)),
    "date": lambda item: int(item.get("year", 0)),
    "novelty": lambda item: int(item.get("year", 0)),
    "popularity": lambda item: int(item.get("score_count", 0)),
    "startDate": lambda item: int(item.get("year", 0)),
    "createdAt": lambda item: int(item.get("year", 0)),
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
    sort = query.get("sort") or "popularity"
    order = query.get("order") or "desc"
    strict = query.get("strict") == "1"

    # Year range: yearFrom/yearTo replace the old single "year".
    # Still accept "year" for backwards compat.
    year_from = _optional_int(query.get("yearFrom")) or _optional_int(query.get("year"))
    year_to = _optional_int(query.get("yearTo")) or _optional_int(query.get("year"))

    # Multi-value params — frontend sends comma-separated strings.
    genres = _split_param(query.get("genre"))
    statuses = _split_param(query.get("status"))
    types = _split_param(query.get("type"))
    seasons = _split_param(query.get("season"))

    filtered = [
        item
        for item in anime
        if _matches(
            item, search, genres, statuses, year_from, year_to, seasons, types, strict
        )
    ]

    # novelty / startDate must not include announced titles
    if sort in ("novelty", "startDate"):
        filtered = [item for item in filtered if item.get("status") != "announced"]

    reverse = order != "asc" and sort != "title"
    key = (
        (lambda item: item.get("title_en", ""))
        if sort == "title"
        else SORTERS.get(sort, SORTERS["popularity"])
    )
    sorted_items = sorted(filtered, key=key, reverse=reverse)  # type: ignore[arg-type]
    start = (page - 1) * limit
    return {
        "data": sorted_items[start : start + limit],
        "total": len(filtered),
        "page": page,
    }


def _matches(
    item: Anime,
    search: str,
    genres: list[str],
    statuses: list[str],
    year_from: int | None,
    year_to: int | None,
    seasons: list[str],
    types: list[str],
    strict: bool,
) -> bool:
    titles = [
        str(item.get("title_en", "")),
        str(item.get("title_ru", "")),
        str(item.get("title_jp", "")),
    ]
    item_genres = [g.lower() for g in item.get("genres", [])]
    item_year = int(item.get("year") or 0)

    if not genres:
        genre_ok = True
    elif strict:
        genre_ok = all(g.lower() in item_genres for g in genres)  # AND — all must match
    else:
        genre_ok = any(g.lower() in item_genres for g in genres)  # OR  — any is enough

    return (
        (not search or any(search in t.lower() for t in titles))
        and genre_ok
        and (not statuses or item.get("status") in statuses)
        and (not year_from or item_year >= year_from)
        and (not year_to or item_year <= year_to)
        and (not seasons or item.get("season") in seasons)
        and (not types or item.get("type") in types)
    )


# ── Helpers ───────────────────────────────────────────────────────────────────


def _split_param(value: str | None) -> list[str]:
    """Split a comma-separated query param; return [] when absent."""
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


def _positive_int(value: str | None, fallback: int) -> int:
    parsed = _optional_int(value)
    return parsed if parsed and parsed > 0 else fallback


def _optional_int(value: str | None) -> int | None:
    try:
        return int(value or "")
    except ValueError:
        return None
