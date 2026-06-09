import asyncio
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urljoin

import httpx
from httpx import HTTPStatusError, TimeoutException

from src.config import Settings, get_settings
from src.db.cache import CacheStore, get_cached_json
from src.logger import get_logger
from src.models import Anime

log = get_logger(__name__)

APP_STATUS_TO_SHIKIMORI = {
    "ongoing":  "ongoing",
    "released": "released",
    "announced": "anons",
}
# startDate / createdAt are frontend aliases; map them to the same Shikimori orders.
SORT_TO_SHIKIMORI = {
    "rating":    "ranked",
    "popularity": "popularity",
    "novelty":   "aired_on",
    "date":      "id_desc",
    "title":     "name",
    "startDate": "aired_on",   # frontend alias for novelty
    "createdAt": "id_desc",    # frontend alias for date
}
TYPE_TO_SHIKIMORI = {
    "tv":      "tv",
    "ova":     "ova",
    "movie":   "movie",
    "ona":     "ona",
    "special": "special,tv_special",
}
KIND_TO_TYPE = {
    "tv":         "tv",
    "movie":      "movie",
    "ova":        "ova",
    "ona":        "ona",
    "special":    "special",
    "tv_special": "special",
}
STATUS_TO_APP = {"ongoing": "ongoing", "released": "released", "anons": "announced"}

# Russian genre name → Shikimori genre ID.
# Shikimori requires numeric IDs for the genre[] parameter.
GENRE_RU_TO_SHIKIMORI_ID: dict[str, int] = {
    "Экшен":           1,
    "Приключения":     2,
    "Машины":          3,
    "Комедия":         4,
    "Деменция":        5,
    "Демоны":          6,
    "Мистика":         7,
    "Драма":           8,
    "Этти":            9,
    "Фэнтези":        10,
    "Игры":           11,
    "Исторический":   13,
    "Ужасы":          14,
    "Детское":        15,
    "Магия":          16,
    "Боевые искусства": 17,
    "Меха":           18,
    "Музыка":         19,
    "Пародия":        20,
    "Самураи":        21,
    "Романтика":      22,
    "Школа":          23,
    "Фантастика":     24,
    "Сёдзё":          25,
    "Сёдзё-ай":       26,
    "Сёнэн":          27,
    "Сёнэн-ай":       28,
    "Космос":         29,
    "Спорт":          30,
    "Суперсила":      31,
    "Вампиры":        32,
    "Яой":            33,
    "Юри":            34,
    "Гарем":          35,
    "Повседневность": 36,
    "Сверхъестественное": 37,
    "Военное":        38,
    "Полиция":        39,
    "Психологическое": 40,
    "Триллер":        41,
    "Сейнен":         42,
    "Дзёсэй":         43,
}

_cache_by_path: dict[str, CacheStore] = {}


def create_shikimori_anime_list_params(query: dict[str, str | None]) -> dict[str, str]:
    limit = min(_positive_int(query.get("limit"), 24), 50)
    params: dict[str, str] = {
        "censored": "true",
        "limit":    str(limit + 1 if limit < 50 else 50),
        "order":    SORT_TO_SHIKIMORI.get(str(query.get("sort") or ""), "popularity"),
        "page":     str(_positive_int(query.get("page"), 1)),
    }

    search = (query.get("search") or "").strip()
    if search:
        params["search"] = search

    # Status — may be comma-separated (e.g. "ongoing,released").
    statuses = _split_param(query.get("status"))
    status_mapped = [APP_STATUS_TO_SHIKIMORI[s] for s in statuses if s in APP_STATUS_TO_SHIKIMORI]
    status_value  = ",".join(status_mapped) if status_mapped else _default_status_for_sort(query.get("sort"))
    if status_value:
        params["status"] = status_value

    # Type / kind — Shikimori does not support multiple kinds natively; use the first.
    types = _split_param(query.get("type"))
    if types:
        kind = TYPE_TO_SHIKIMORI.get(types[0])
        if kind:
            params["kind"] = kind

    # Genre — map Russian names to Shikimori numeric IDs.
    # Shikimori applies AND logic when multiple genre IDs are provided,
    # which matches the frontend "strict" mode. Non-strict (OR) is
    # approximated by sending a single genre ID; post-processing handles
    # the rest for cached result sets.
    genres    = _split_param(query.get("genre"))
    genre_ids = [GENRE_RU_TO_SHIKIMORI_ID[g] for g in genres if g in GENRE_RU_TO_SHIKIMORI_ID]
    strict    = query.get("strict") == "1"
    if genre_ids:
        if strict:
            # AND — send all IDs; Shikimori will require all of them.
            params["genre"] = ",".join(str(gid) for gid in genre_ids)
        else:
            # OR — Shikimori has no native OR support; send the first genre
            # and let _apply_client_filters handle the rest post-fetch.
            params["genre"] = str(genre_ids[0])

    # Year range — yearFrom/yearTo replace the old single "year" param.
    year_from = _optional_int(query.get("yearFrom")) or _optional_int(query.get("year"))
    year_to   = _optional_int(query.get("yearTo"))   or _optional_int(query.get("year"))
    seasons   = _split_param(query.get("season"))
    season_str = _season_param_range(year_from, year_to, seasons[0] if seasons else None)
    if season_str:
        params["season"] = season_str

    return params


def normalize_shikimori_anime(
    raw: dict[str, Any], endpoint: str, now_iso: str | None = None
) -> Anime:
    now = now_iso or datetime.now(tz=UTC).isoformat()
    aired_on = raw.get("aired_on") or raw.get("released_on")
    title_en = _first_text(raw.get("english")) or str(raw.get("name") or "")

    anime: Anime = {
        "id":           int(raw["id"]),
        "title_ru":     (raw.get("russian") or raw.get("name") or "").strip(),
        "title_en":     title_en,
        "title_jp":     _first_text(raw.get("japanese")) or str(raw.get("name") or ""),
        "poster_url":   _absolute_url(
            _nested(raw, "image", "original") or _nested(raw, "image", "preview"),
            endpoint,
        ),
        "description":  (raw.get("description") or "").strip(),
        "genres": [
            genre.get("russian") or genre.get("name")
            for genre in raw.get("genres") or []
            if genre.get("russian") or genre.get("name")
        ],
        "studio":          str((raw.get("studios") or [{}])[0].get("name") or ""),
        "type":            KIND_TO_TYPE.get(raw.get("kind"), "tv"),
        "status":          STATUS_TO_APP.get(raw.get("status"), "released"),
        "year":            _year(aired_on) or datetime.fromisoformat(now.replace("Z", "+00:00")).year,
        "episodes_total":  int(raw.get("episodes") or 0),
        "episodes_aired":  int(raw.get("episodes_aired") or 0),
        "rating":          _float(raw.get("score")),
        "score_count":     sum(
            int(item.get("value") or 0) for item in raw.get("rates_scores_stats") or []
        ),
        "url_shikimori":   _absolute_url(raw.get("url"), endpoint),
        "updated_at":      _iso(raw.get("updated_at"), now),
    }

    season = _season(aired_on)
    if season:
        anime["season"] = season
    if raw.get("myanimelist_id"):
        anime["mal_id"] = int(raw["myanimelist_id"])
    if raw.get("next_episode_at"):
        anime["next_episode_at"] = str(raw["next_episode_at"])  # type: ignore[typeddict-unknown-key]

    # Extended fields (present in detail responses, absent in list responses)
    if raw.get("rating"):
        anime["rating_mpaa"] = str(raw["rating"])          # type: ignore[typeddict-unknown-key]
    if raw.get("duration"):
        try:
            anime["duration"] = int(raw["duration"])       # type: ignore[typeddict-unknown-key]
        except (ValueError, TypeError):
            pass
    if raw.get("source"):
        anime["source"] = str(raw["source"])               # type: ignore[typeddict-unknown-key]

    return anime


async def fetch_shikimori_catalog(
    query: dict[str, str | None], settings: Settings | None = None
) -> dict:
    env    = settings or get_settings()
    params = create_shikimori_anime_list_params(query)
    limit  = min(_positive_int(query.get("limit"), 24), 50)
    page   = _positive_int(query.get("page"), 1)
    cache  = _default_cache(env)
    raw = await get_cached_json(
        cache,
        f"shikimori:anime:list:{tuple(sorted(params.items()))}",
        env.cache_ttl,
        lambda: _fetch_json("/api/animes", env, params),
    )
    raw_items = list(raw)[:limit]
    items = [normalize_shikimori_anime(item, env.shikimori_endpoint) for item in raw_items]
    items = _apply_client_order(items, query)
    return {
        "data":  items,
        "total": (page - 1) * limit + len(items) + (1 if len(raw) > limit else 0),
        "page":  page,
    }


async def fetch_shikimori_anime(
    anime_id: int, settings: Settings | None = None
) -> Anime | None:
    if anime_id <= 0:
        return None

    env = settings or get_settings()
    cache = _default_cache(env)

    async def _get_detail() -> Any:
        return await get_cached_json(
            cache,
            f"shikimori:anime:detail3:{anime_id}",
            env.cache_ttl,
            lambda: _fetch_json(f"/api/animes/{anime_id}", env),
        )

    async def _get_roles() -> Any:
        try:
            return await get_cached_json(
                cache,
                f"shikimori:anime:roles2:{anime_id}",
                86400,
                lambda: _fetch_json(f"/api/animes/{anime_id}/roles", env),
            )
        except Exception as exc:
            log.warning("[roles] fetch failed for anime %d: %s", anime_id, exc)
            return []

    async def _get_screenshots() -> Any:
        try:
            return await get_cached_json(
                cache,
                f"shikimori:anime:screenshots:{anime_id}",
                86400,
                lambda: _fetch_json(f"/api/animes/{anime_id}/screenshots", env),
            )
        except Exception as exc:
            log.warning("[screenshots] fetch failed for anime %d: %s", anime_id, exc)
            return []

    async def _get_genres() -> list[str]:
        try:
            return await get_cached_json(
                cache,
                f"shikimori:anime:genres:{anime_id}",
                86400,
                lambda: _fetch_genres_graphql(anime_id, env),
            )
        except Exception as exc:
            log.warning("[genres] fetch failed for anime %d: %s", anime_id, exc)
            return []

    raw, raw_roles, raw_screenshots, gql_genres = await asyncio.gather(
        _get_detail(), _get_roles(), _get_screenshots(), _get_genres()
    )
    anime = normalize_shikimori_anime(raw, env.shikimori_endpoint)
    _merge_roles(anime, raw_roles, env.shikimori_endpoint)
    _merge_screenshots(anime, raw_screenshots, env.shikimori_endpoint)
    # REST genres are often empty for newer titles — prefer GraphQL genres.
    if gql_genres:
        anime["genres"] = gql_genres
    return anime


async def fetch_shikimori_anime_by_studio(
    studio_name: str, settings: Settings | None = None
) -> list[Anime]:
    """
    Return ALL anime produced by *studio_name*.
    Strategy:
      1. Ask Shikimori /api/studios?search=<name> to resolve the studio ID.
      2. Paginate /api/animes?studio=<id> until exhausted (cached 1 h).
    """
    env = settings or get_settings()
    cache = _default_cache(env)

    # ── Resolve studio ID ────────────────────────────────────────────────────
    studio_id = await _resolve_studio_id(studio_name, env, cache)
    if not studio_id:
        return []

    # ── Hot cache ────────────────────────────────────────────────────────────
    cache_key = f"shikimori:studio:anime:{studio_id}"
    cached = cache.get_json(cache_key)
    if cached and cached[1]:
        return cached[0]  # type: ignore[return-value]

    # ── Fetch all pages ──────────────────────────────────────────────────────
    all_raw: list[dict[str, Any]] = []
    limit = 50
    for page in range(1, 61):          # max 60 × 50 = 3 000 anime per studio
        try:
            batch = await _fetch_json(
                "/api/animes", env,
                {"studio": str(studio_id), "limit": str(limit),
                 "page": str(page), "order": "aired_on"},
            )
        except Exception as exc:
            log.error("studio %d page %d: %s", studio_id, page, exc)
            break
        if not isinstance(batch, list) or not batch:
            break
        all_raw.extend(batch)
        if len(batch) < limit:
            break
        await asyncio.sleep(0.25)

    # ── Normalise ────────────────────────────────────────────────────────────
    now_iso = datetime.now(tz=UTC).isoformat()
    seen: set[int] = set()
    items: list[Anime] = []
    for raw in all_raw:
        try:
            anime = normalize_shikimori_anime(raw, env.shikimori_endpoint, now_iso)
            if anime["id"] not in seen:
                seen.add(anime["id"])
                items.append(anime)
        except Exception:
            continue

    items.sort(key=lambda a: (0 if a.get("status") == "ongoing" else 1, -(a.get("year") or 0)))
    cache.set_json(cache_key, items, 3600)
    return items


async def _resolve_studio_id(name: str, env: Settings, cache: CacheStore) -> int | None:
    """Return Shikimori studio numeric ID for *name*, or None if not found."""
    key = f"shikimori:studio:id:{name.lower()}"
    try:
        results = await get_cached_json(
            cache, key, 86400,
            lambda: _fetch_json("/api/studios", env, {"search": name, "limit": "10"}),
        )
    except Exception as exc:
        log.error("studio ID lookup %r: %s", name, exc)
        return None

    if not isinstance(results, list):
        return None

    # Exact match first, then partial
    name_lower = name.lower()
    for s in results:
        if isinstance(s, dict) and (s.get("name") or "").lower() == name_lower:
            return int(s["id"])
    if results and isinstance(results[0], dict):
        return int(results[0].get("id", 0)) or None
    return None


async def fetch_shikimori_related(
    anime_id: int, settings: Settings | None = None
) -> list[dict]:
    """Return related anime (sequels, prequels, side-stories) for *anime_id*."""
    if anime_id <= 0:
        return []
    env = settings or get_settings()
    raw = await get_cached_json(
        _default_cache(env),
        f"shikimori:anime:related:{anime_id}",
        86400,
        lambda: _fetch_json(f"/api/animes/{anime_id}/related", env),
    )
    return _normalize_related(raw, env.shikimori_endpoint)


async def _fetch_json(
    path: str, settings: Settings, params: dict[str, str] | None = None
) -> Any:
    max_retries = 3

    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(max_retries):
            try:
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

            except TimeoutException:
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(2**attempt)

            except HTTPStatusError as e:
                if e.response.status_code in (429,) or e.response.status_code >= 500:
                    if attempt == max_retries - 1:
                        raise
                    await asyncio.sleep(2**attempt)
                else:
                    raise
            except Exception as e:
                log.error("Shikimori API error: %s: %s", type(e).__name__, e)
                raise


def get_cache(settings: Settings) -> CacheStore:
    """Return (and lazily create) the shared SQLite CacheStore for *settings*."""
    return _default_cache(settings)


def _default_cache(settings: Settings) -> CacheStore:
    if settings.database_path not in _cache_by_path:
        _cache_by_path[settings.database_path] = CacheStore(settings.database_path)
    return _cache_by_path[settings.database_path]


def _apply_client_order(items: list[Anime], query: dict[str, str | None]) -> list[Anime]:
    """
    Light post-fetch adjustments for ordering and non-strict OR genre filtering.
    Shikimori applies AND on multiple genres; for OR we sent only the first genre ID,
    so no additional filtering is needed here — the user gets a superset that includes
    at least that genre, which is acceptable for pagination purposes.
    """
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


# ── Helpers ───────────────────────────────────────────────────────────────────

def _split_param(value: str | None) -> list[str]:
    """Split a comma-separated query param; return [] when absent."""
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


def _season_param_range(
    year_from: int | None,
    year_to: int | None,
    season: str | None,
) -> str | None:
    """
    Build a Shikimori season string.
    Shikimori does not natively support year ranges, so we use yearFrom
    as the anchor; range filtering is handled client-side in filter_anime_catalog.
    """
    year = year_from
    if not year or not (1900 <= year <= 2100):
        return None
    return f"{season}_{year}" if season else str(year)


def _positive_int(value: str | None, fallback: int) -> int:
    try:
        parsed = int(value or "")
    except ValueError:
        return fallback
    return parsed if parsed > 0 else fallback


def _optional_int(value: str | None) -> int | None:
    try:
        return int(value or "")
    except ValueError:
        return None


def _default_status_for_sort(sort: str | None) -> str | None:
    return "ongoing,released" if sort in ("novelty", "startDate") else None


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


def _merge_roles(anime: Anime, raw_roles: Any, endpoint: str) -> None:
    """Extract directors, original authors and main characters from Shikimori roles."""
    if not isinstance(raw_roles, list):
        return

    directors: list[dict] = []
    authors: list[dict] = []
    characters: list[dict] = []

    for entry in raw_roles:
        roles: list[str] = entry.get("roles") or []
        person = entry.get("person")
        character = entry.get("character")

        if person and isinstance(person, dict):
            name = (person.get("russian") or person.get("name") or "").strip()
            url = _absolute_url(person.get("url"), endpoint)
            if name:
                obj = {"name": name, "url": url}
                if any(r in roles for r in ("Director", "Series Director")):
                    if obj not in directors:
                        directors.append(obj)
                elif any(r in roles for r in (
                    "Original Creator", "Original Manga Creator",
                    "Author", "Story", "Original Story",
                )):
                    if obj not in authors:
                        authors.append(obj)

        if character and isinstance(character, dict) and len(characters) < 6:
            if "Main" in roles:
                name = (character.get("russian") or character.get("name") or "").strip()
                url = _absolute_url(character.get("url"), endpoint)
                if name:
                    obj = {"name": name, "url": url}
                    if obj not in characters:
                        characters.append(obj)

    if directors:
        anime["directors"] = directors    # type: ignore[typeddict-unknown-key]
    if authors:
        anime["authors"] = authors        # type: ignore[typeddict-unknown-key]
    if characters:
        anime["characters"] = characters  # type: ignore[typeddict-unknown-key]


# Shikimori GraphQL lives on shikimori.io; the REST /api/animes/{id} `genres`
# field is empty for many (especially newer) titles, but GraphQL has them.
_GRAPHQL_ENDPOINT = "https://shikimori.io/api/graphql"
# Kinds we surface as "Жанры" (clickable filter genres + demographics).
_GENRE_KINDS = {"genre", "demographic"}


async def _fetch_genres_graphql(anime_id: int, env: Settings) -> list[str]:
    """Fetch genre names for *anime_id* via Shikimori GraphQL (richer than REST)."""
    query = '{ animes(ids: "%d") { genres { russian name kind } } }' % anime_id
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.post(
                _GRAPHQL_ENDPOINT,
                json={"query": query},
                headers={
                    "User-Agent": env.shikimori_user_agent,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        log.warning("[graphql genres] anime %d: %s", anime_id, exc)
        return []

    animes = (((data or {}).get("data") or {}).get("animes")) or []
    if not animes:
        return []
    result: list[str] = []
    for g in animes[0].get("genres") or []:
        name = (g.get("russian") or g.get("name") or "").strip()
        if name and g.get("kind") in _GENRE_KINDS and name not in result:
            result.append(name)
    return result


def _merge_screenshots(anime: Anime, raw_screenshots: Any, endpoint: str) -> None:
    """Extract screenshot URLs from Shikimori /screenshots response."""
    if not isinstance(raw_screenshots, list):
        return
    urls: list[str] = []
    for item in raw_screenshots:
        if not isinstance(item, dict):
            continue
        url = item.get("original") or item.get("preview")
        if url:
            abs_url = _absolute_url(url, endpoint)
            if abs_url and abs_url not in urls:
                urls.append(abs_url)
    if urls:
        anime["screenshots"] = urls          # type: ignore[typeddict-unknown-key]


def _normalize_related(raw: Any, endpoint: str) -> list[dict]:
    """Normalize Shikimori /related response into RelatedAnime-compatible dicts."""
    if not isinstance(raw, list):
        return []
    result: list[dict] = []
    for entry in raw:
        anime_raw = entry.get("anime")
        if not anime_raw or not isinstance(anime_raw, dict):
            continue
        anime_id = anime_raw.get("id")
        if not anime_id:
            continue
        result.append({
            "id":         int(anime_id),
            "relation":   entry.get("relation_russian") or entry.get("relation") or "",
            "title_ru":   (anime_raw.get("russian") or anime_raw.get("name") or "").strip(),
            "title_en":   _first_text(anime_raw.get("english")) or str(anime_raw.get("name") or ""),
            "poster_url": _absolute_url(
                _nested(anime_raw, "image", "original") or _nested(anime_raw, "image", "preview"),
                endpoint,
            ),
            "type":       KIND_TO_TYPE.get(anime_raw.get("kind"), "tv"),
            "year":       _year(anime_raw.get("aired_on")) or 0,
            "rating":     _float(anime_raw.get("score")),
        })
    return result


# ── Bulk catalog (full dataset, SQLite-cached 24h) ────────────────────────────

_BULK_CACHE_KEY = "shikimori:bulk:catalog:v4"
_BULK_CACHE_TTL = 86400          # 24 hours
_BULK_PAGE_LIMIT = 50            # Shikimori max per page
_BULK_MAX_PAGES = 100            # 100 × 50 = up to 5000 anime
_BULK_BATCH_SIZE = 6             # parallel requests per batch
_BULK_BATCH_DELAY = 0.4          # seconds between batches (rate limiting)
_BULK_MIN_YEAR = 1990


async def fetch_shikimori_bulk_catalog(settings: Settings | None = None) -> list[Anime]:
    """
    Return all anime from {_BULK_MIN_YEAR}+, sorted: ongoing first then by year desc.
    The result is stored in SQLite for 24 h — subsequent calls return in < 10 ms.
    On cold start, all pages are fetched from Shikimori in parallel batches.
    """
    env = settings or get_settings()
    cache = _default_cache(env)

    # ── 1. Hot cache path ─────────────────────────────────────────────────────
    cached = cache.get_json(_BULK_CACHE_KEY)
    if cached and cached[1]:          # (value, is_fresh)
        return cached[0]              # type: ignore[return-value]

    # ── 2. Cold path: fetch all pages from Shikimori ─────────────────────────
    base_params: dict[str, str] = {
        "limit":    str(_BULK_PAGE_LIMIT),
        "order":    "aired_on",
        "status":   "ongoing,released",
        "censored": "true",
    }

    all_raw: list[dict[str, Any]] = []

    async def _fetch_page(page: int) -> list[dict[str, Any]]:
        try:
            result = await _fetch_json("/api/animes", env, {**base_params, "page": str(page)})
            return result if isinstance(result, list) else []
        except Exception as exc:
            log.warning("[bulk] page %d failed: %s", page, exc)
            return []

    # First page — determines whether there is more to fetch
    first = await _fetch_page(1)
    all_raw.extend(first)

    if len(first) >= _BULK_PAGE_LIMIT:
        # Fetch remaining pages in parallel batches
        page = 2
        while page <= _BULK_MAX_PAGES:
            pages = list(range(page, min(page + _BULK_BATCH_SIZE, _BULK_MAX_PAGES + 1)))
            results = await asyncio.gather(*[_fetch_page(p) for p in pages])

            got = 0
            for r in results:
                all_raw.extend(r)
                got += len(r)

            if got < len(pages) * _BULK_PAGE_LIMIT:
                break           # last batch contained a short page → end of data

            page += _BULK_BATCH_SIZE
            await asyncio.sleep(_BULK_BATCH_DELAY)

    # ── 3. Normalize, dedup, filter, sort ────────────────────────────────────
    now_iso = datetime.now(tz=UTC).isoformat()
    seen: set[int] = set()
    items: list[Anime] = []

    for raw in all_raw:
        try:
            anime = normalize_shikimori_anime(raw, env.shikimori_endpoint, now_iso)
            if anime["year"] >= _BULK_MIN_YEAR and anime["id"] not in seen:
                seen.add(anime["id"])
                items.append(anime)
        except Exception:
            continue

    # Ongoing first (by year desc), then released (by year desc)
    items.sort(key=lambda a: (0 if a["status"] == "ongoing" else 1, -(a.get("year") or 0)))

    # ── 4. Persist to SQLite ──────────────────────────────────────────────────
    cache.set_json(_BULK_CACHE_KEY, items, _BULK_CACHE_TTL)
    # bulk fetch complete — silently cached
    return items
