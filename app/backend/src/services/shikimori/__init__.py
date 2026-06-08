from datetime import UTC, datetime
from typing import Any
from urllib.parse import urljoin

import httpx

from src.config import Settings, get_settings
from src.db.cache import CacheStore, get_cached_json
from src.models import Anime

APP_STATUS_TO_SHIKIMORI = {
    "ongoing": "ongoing",
    "released": "released",
    "announced": "anons",
}
SORT_TO_SHIKIMORI = {
    "rating": "ranked",
    "popularity": "popularity",
    "novelty": "aired_on",
    "date": "id_desc",
    "title": "name",
}
TYPE_TO_SHIKIMORI = {
    "tv": "tv",
    "ova": "ova",
    "movie": "movie",
    "ona": "ona",
    "special": "special,tv_special",
}
KIND_TO_TYPE = {
    "tv": "tv",
    "movie": "movie",
    "ova": "ova",
    "ona": "ona",
    "special": "special",
    "tv_special": "special",
}
STATUS_TO_APP = {"ongoing": "ongoing", "released": "released", "anons": "announced"}

_cache_by_path: dict[str, CacheStore] = {}


def create_shikimori_anime_list_params(query: dict[str, str | None]) -> dict[str, str]:
    limit = min(_positive_int(query.get("limit"), 24), 50)
    params = {
        "censored": "true",
        "limit": str(limit + 1 if limit < 50 else 50),
        "order": SORT_TO_SHIKIMORI.get(str(query.get("sort") or ""), "popularity"),
        "page": str(_positive_int(query.get("page"), 1)),
    }

    search = (query.get("search") or "").strip()
    if search:
        params["search"] = search

    status = APP_STATUS_TO_SHIKIMORI.get(
        str(query.get("status") or "")
    ) or _default_status_for_sort(query.get("sort"))
    if status:
        params["status"] = status

    kind = TYPE_TO_SHIKIMORI.get(str(query.get("type") or ""))
    if kind:
        params["kind"] = kind

    season = _season_param(query.get("year"), query.get("season"))
    if season:
        params["season"] = season

    return params


def normalize_shikimori_anime(
    raw: dict[str, Any], endpoint: str, now_iso: str | None = None
) -> Anime:
    now = now_iso or datetime.now(tz=UTC).isoformat()
    aired_on = raw.get("aired_on") or raw.get("released_on")
    title_en = _first_text(raw.get("english")) or str(raw.get("name") or "")

    anime: Anime = {
        "id": int(raw["id"]),
        "title_ru": (raw.get("russian") or raw.get("name") or "").strip(),
        "title_en": title_en,
        "title_jp": _first_text(raw.get("japanese")) or str(raw.get("name") or ""),
        "poster_url": _absolute_url(
            _nested(raw, "image", "original") or _nested(raw, "image", "preview"),
            endpoint,
        ),
        "description": (raw.get("description") or "").strip(),
        "genres": [
            genre.get("russian") or genre.get("name")
            for genre in raw.get("genres") or []
            if genre.get("russian") or genre.get("name")
        ],
        "studio": str((raw.get("studios") or [{}])[0].get("name") or ""),
        "type": KIND_TO_TYPE.get(raw.get("kind"), "tv"),
        "status": STATUS_TO_APP.get(raw.get("status"), "released"),
        "year": _year(aired_on)
        or datetime.fromisoformat(now.replace("Z", "+00:00")).year,
        "episodes_total": int(raw.get("episodes") or 0),
        "episodes_aired": int(raw.get("episodes_aired") or 0),
        "rating": _float(raw.get("score")),
        "score_count": sum(
            int(item.get("value") or 0) for item in raw.get("rates_scores_stats") or []
        ),
        "url_shikimori": _absolute_url(raw.get("url"), endpoint),
        "updated_at": _iso(raw.get("updated_at"), now),
    }

    season = _season(aired_on)
    if season:
        anime["season"] = season
    if raw.get("myanimelist_id"):
        anime["mal_id"] = int(raw["myanimelist_id"])

    return anime


async def fetch_shikimori_catalog(
    query: dict[str, str | None], settings: Settings | None = None
) -> dict:
    env = settings or get_settings()
    params = create_shikimori_anime_list_params(query)
    limit = min(_positive_int(query.get("limit"), 24), 50)
    page = _positive_int(query.get("page"), 1)
    cache = _default_cache(env)
    raw = await get_cached_json(
        cache,
        f"shikimori:anime:list:{tuple(sorted(params.items()))}",
        env.cache_ttl,
        lambda: _fetch_json("/api/animes", env, params),
    )
    raw_items = list(raw)[:limit]
    items = [
        normalize_shikimori_anime(item, env.shikimori_endpoint) for item in raw_items
    ]
    items = _apply_client_order(items, query)
    return {
        "data": items,
        "total": (page - 1) * limit + len(items) + (1 if len(raw) > limit else 0),
        "page": page,
    }


async def fetch_shikimori_anime(
    anime_id: int, settings: Settings | None = None
) -> Anime | None:
    if anime_id <= 0:
        return None

    env = settings or get_settings()
    raw = await get_cached_json(
        _default_cache(env),
        f"shikimori:anime:details:{anime_id}",
        env.cache_ttl,
        lambda: _fetch_json(f"/api/animes/{anime_id}", env),
    )
    return normalize_shikimori_anime(raw, env.shikimori_endpoint)


async def _fetch_json(
    path: str, settings: Settings, params: dict[str, str] | None = None
) -> Any:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            urljoin(settings.shikimori_endpoint, path),
            params=params,
            headers={
                "Accept": "application/json",
                "User-Agent": settings.shikimori_user_agent,
            },
        )
        response.raise_for_status()
        return response.json()


def _default_cache(settings: Settings) -> CacheStore:
    if settings.database_path not in _cache_by_path:
        _cache_by_path[settings.database_path] = CacheStore(settings.database_path)
    return _cache_by_path[settings.database_path]


def _positive_int(value: str | None, fallback: int) -> int:
    try:
        parsed = int(value or "")
    except ValueError:
        return fallback
    return parsed if parsed > 0 else fallback


def _season_param(year_value: str | None, season: str | None) -> str | None:
    try:
        year = int(year_value or "")
    except ValueError:
        return None
    if year < 1900 or year > 2100:
        return None
    return f"{season}_{year}" if season else str(year)


def _default_status_for_sort(sort: str | None) -> str | None:
    return "ongoing,released" if sort == "novelty" else None


def _apply_client_order(
    items: list[Anime], query: dict[str, str | None]
) -> list[Anime]:
    if query.get("order") != "asc":
        return items

    sort = query.get("sort")
    if sort == "rating":
        return sorted(items, key=lambda item: float(item.get("rating") or 0))
    if sort == "date":
        return sorted(items, key=lambda item: int(item.get("id") or 0))
    if sort == "novelty":
        return sorted(items, key=lambda item: int(item.get("year") or 0))

    return list(reversed(items))


def _first_text(values: Any) -> str | None:
    if not isinstance(values, list):
        return None
    return next(
        (value.strip() for value in values if isinstance(value, str) and value.strip()),
        None,
    )


def _nested(raw: dict[str, Any], *keys: str) -> Any:
    value: Any = raw
    for key in keys:
        value = value.get(key) if isinstance(value, dict) else None
    return value


def _absolute_url(value: Any, endpoint: str) -> str:
    return urljoin(endpoint, value) if isinstance(value, str) and value else ""


def _float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


def _iso(value: Any, fallback: str) -> str:
    try:
        date = (
            datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            if value
            else datetime.fromisoformat(fallback)
        )
    except ValueError:
        date = datetime.fromisoformat(fallback)
    return date.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _year(value: Any) -> int | None:
    return int(value[:4]) if isinstance(value, str) and value[:4].isdigit() else None


def _season(value: Any) -> str | None:
    if not isinstance(value, str) or len(value) < 7:
        return None
    month = int(value[5:7])
    if 3 <= month <= 5:
        return "spring"
    if 6 <= month <= 8:
        return "summer"
    if 9 <= month <= 11:
        return "fall"
    return "winter"
