from src.config import get_settings
from src.logger import get_logger
from src.models import Anime
from src.services.shikimori import (
    fetch_shikimori_anime,
    fetch_shikimori_anime_by_studio,
    fetch_shikimori_bulk_catalog,
    fetch_shikimori_catalog,
    fetch_shikimori_related,
    get_cache,
)
from src.services.yummyanime import fetch_yummyanime_description

log = get_logger(__name__)

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
        log.error("catalog fetch: %s", error)
        raise


async def get_bulk_anime_catalog() -> dict:
    """
    Return the full catalog from the LOCAL anime_catalog table (no Shikimori
    calls). If the table is empty the response carries needs_sync=true —
    run `python -m src.scripts.sync_shikimori full` to populate it.
    """
    items = await fetch_shikimori_bulk_catalog(get_settings())
    result = {"data": items, "total": len(items)}
    if not items:
        result["needs_sync"] = True
    return result


async def get_dubbing_anime(translation_id: int) -> dict:
    """Return anime voiced by the given Kodik dubbing team (translation id).

    Kodik /list gives Shikimori ids; details come from the bulk catalog cache
    so no extra Shikimori requests are made.
    """
    from src.services.kodik import get_dubbing_shikimori_ids

    try:
        ids = await get_dubbing_shikimori_ids(translation_id)
        if not ids:
            return {"data": [], "total": 0, "translation_id": translation_id}
        catalog = await fetch_shikimori_bulk_catalog(get_settings())
        by_id = {item["id"]: item for item in catalog}
        items = [by_id[i] for i in ids if i in by_id]
        return {"data": items, "total": len(items), "translation_id": translation_id}
    except Exception as error:
        log.error("get_dubbing_anime %d: %s", translation_id, error)
        return {"data": [], "total": 0, "translation_id": translation_id}


async def get_studio_anime(studio_name: str) -> dict:
    """Return all anime for a studio, fetched directly from Shikimori (1 h SQLite cache)."""
    try:
        items = await fetch_shikimori_anime_by_studio(studio_name, get_settings())
        return {"data": items, "total": len(items), "studio": studio_name}
    except Exception as error:
        log.error("get_studio_anime %r: %s", studio_name, error)
        return {"data": [], "total": 0, "studio": studio_name}


async def get_anime_related(anime_id: int) -> list[dict]:
    """Return related anime (sequels, prequels, etc.) for *anime_id*."""
    try:
        return await fetch_shikimori_related(anime_id, get_settings())
    except Exception as error:
        log.warning("related %d: %s", anime_id, error)
        return []


async def get_anime_by_id(anime_id: int) -> Anime | None:
    try:
        env = get_settings()
        anime = await fetch_shikimori_anime(anime_id, env)
        if anime is None:
            return None
        # If Shikimori has no description, try YummyAnime as fallback
        if not (anime.get("description") or "").strip():
            desc = await fetch_yummyanime_description(
                shikimori_id=anime["id"],
                title_ru=anime.get("title_ru") or "",
                title_en=anime.get("title_en") or "",
                mal_id=anime.get("mal_id"),
                endpoint=env.yummyanime_endpoint,
                token=env.yummyanime_token,
                cache=get_cache(env),
            )
            if desc:
                anime["description"] = desc  # type: ignore[typeddict-unknown-key]
        return anime
    except Exception as error:
        log.error("anime detail %d: %s", anime_id, error)
        return None


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
