"""Paginated catalog queries (REST) with client-side ordering."""

from src.config import Settings, get_settings
from src.db.cache import get_cached_json
from src.models import Anime
from src.services.shikimori.constants import (
    APP_STATUS_TO_SHIKIMORI,
    GENRE_RU_TO_SHIKIMORI_ID,
    SORT_TO_SHIKIMORI,
    TYPE_TO_SHIKIMORI,
)
from src.services.shikimori.helpers import (
    default_status_for_sort,
    get_cache,
    optional_int,
    positive_int,
    season_param_range,
    split_param,
)
from src.services.shikimori.http import fetch_rest_json
from src.services.shikimori.normalizers import normalize_shikimori_anime


def create_shikimori_anime_list_params(query: dict[str, str | None]) -> dict[str, str]:
    """Build Shikimori REST params (still used for fallback / direct catalog calls)."""
    limit = min(positive_int(query.get("limit"), 24), 50)
    params: dict[str, str] = {
        "censored": "true",
        "limit": str(limit + 1 if limit < 50 else 50),
        "order": SORT_TO_SHIKIMORI.get(str(query.get("sort") or ""), "popularity"),
        "page": str(positive_int(query.get("page"), 1)),
    }

    search = (query.get("search") or "").strip()
    if search:
        params["search"] = search

    statuses = split_param(query.get("status"))
    status_mapped = [
        APP_STATUS_TO_SHIKIMORI[s] for s in statuses if s in APP_STATUS_TO_SHIKIMORI
    ]
    status_value = (
        ",".join(status_mapped)
        if status_mapped
        else default_status_for_sort(query.get("sort"))
    )
    if status_value:
        params["status"] = status_value

    types = split_param(query.get("type"))
    if types:
        kind = TYPE_TO_SHIKIMORI.get(types[0])
        if kind:
            params["kind"] = kind

    genres = split_param(query.get("genre"))
    genre_ids = [
        GENRE_RU_TO_SHIKIMORI_ID[g] for g in genres if g in GENRE_RU_TO_SHIKIMORI_ID
    ]
    strict = query.get("strict") == "1"
    if genre_ids:
        params["genre"] = (
            ",".join(str(gid) for gid in genre_ids) if strict else str(genre_ids[0])
        )

    year_from = optional_int(query.get("yearFrom")) or optional_int(query.get("year"))
    year_to = optional_int(query.get("yearTo")) or optional_int(query.get("year"))
    seasons = split_param(query.get("season"))
    season_str = season_param_range(year_from, year_to, seasons[0] if seasons else None)
    if season_str:
        params["season"] = season_str

    return params


async def fetch_shikimori_catalog(
    query: dict[str, str | None], settings: Settings | None = None
) -> dict:
    env = settings or get_settings()
    params = create_shikimori_anime_list_params(query)
    limit = min(positive_int(query.get("limit"), 24), 50)
    page = positive_int(query.get("page"), 1)
    cache = get_cache(env)
    raw = await get_cached_json(
        cache,
        f"shikimori:anime:list:{tuple(sorted(params.items()))}",
        env.cache_ttl,
        lambda: fetch_rest_json("/api/animes", env, params),
    )
    raw_items = list(raw)[:limit]
    items = [
        normalize_shikimori_anime(item, env.shikimori_endpoint) for item in raw_items
    ]
    items = apply_client_order(items, query)
    return {
        "data": items,
        "total": (page - 1) * limit + len(items) + (1 if len(raw) > limit else 0),
        "page": page,
    }


def apply_client_order(items: list[Anime], query: dict[str, str | None]) -> list[Anime]:
    if query.get("order") != "asc":
        return items
    sort = query.get("sort")
    if sort in ("rating",):
        return sorted(items, key=lambda item: float(item.get("rating") or 0))
    if sort in ("date", "createdAt"):
        return sorted(items, key=lambda item: int(item.get("id") or 0))
    if sort in ("novelty", "startDate"):
        return sorted(items, key=lambda item: int(item.get("year") or 0))
    return list(reversed(items))
