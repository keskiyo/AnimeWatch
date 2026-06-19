"""Read queries over the `anime` collection: filters, sorting, pages, stats."""

import re
from typing import Any

from pymongo import ASCENDING, DESCENDING

from src.db.anime_catalog import doc_to_anime
from src.db.mongo import get_db
from src.models import Anime

# Hide titles confirmed to have no Kodik dubbing (has_kodik = 0). Missing/null
# (unchecked) and 1 (available) stay visible; announced titles always visible.
_KODIK_VISIBLE: dict = {
    "$or": [{"has_kodik": None}, {"has_kodik": {"$ne": 0}}, {"status": "announced"}]
}

# Default catalog order: ongoing → released → announced, newest, best
_DEFAULT_SORT = [("status_rank", ASCENDING), ("year", DESCENDING), ("rating", DESCENDING)]

# List/card views don't need detail-only fields — exclude them so /anime/bulk
# stays light (description + detail payloads load via /animes/{id}).
_LIGHT_PROJECTION = {
    "description": 0,
    "screenshots": 0,
    "directors": 0,
    "authors": 0,
    "characters": 0,
    "source": 0,
    "detailed_at": 0,
    "synced_at": 0,
    "has_kodik_checked_at": 0,
}


async def get_anime_catalog_by_id(anime_id: int) -> Anime | None:
    doc = await get_db().anime.find_one({"_id": int(anime_id)})
    return doc_to_anime(doc) if doc else None


async def get_anime_catalog_all() -> list[Anime]:
    """Full visible catalog in default order (light projection — list/card view)."""
    cursor = (
        get_db().anime.find(_KODIK_VISIBLE, _LIGHT_PROJECTION).sort(_DEFAULT_SORT)
    )
    return [doc_to_anime(doc) async for doc in cursor]


async def get_sitemap_rows() -> list[dict]:
    """Lightweight rows for the sitemap: id + best title + last update."""
    cursor = get_db().anime.find(
        _KODIK_VISIBLE,
        {"title_ru": 1, "title_en": 1, "updated_at": 1},
    ).sort(_DEFAULT_SORT)
    return [
        {
            "id": doc["_id"],
            "title": doc.get("title_en") or doc.get("title_ru") or "",
            "updated_at": doc.get("updated_at") or "",
        }
        async for doc in cursor
    ]


async def get_anime_catalog_count(query: dict[str, str | None]) -> int:
    return int(await get_db().anime.count_documents(_build_filter(query)))


async def get_anime_catalog_page(query: dict[str, str | None]) -> dict:
    filt = _build_filter(query)
    sort, collation = _sort_spec(query)
    page = max(_to_int(query.get("page")) or 1, 1)
    limit = min(max(_to_int(query.get("limit")) or 24, 1), 100)

    total = await get_db().anime.count_documents(filt)
    cursor = (
        get_db()
        .anime.find(filt, _LIGHT_PROJECTION)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    if collation:
        cursor = cursor.collation(collation)
    data = [doc_to_anime(doc) async for doc in cursor]
    return {"data": data, "total": int(total), "page": page}


async def get_anime_catalog_stats() -> dict:
    coll = get_db().anime
    count = await coll.count_documents({})
    minmax = await coll.aggregate(
        [
            {"$match": {"year": {"$gt": 0}}},
            {"$group": {"_id": None, "min": {"$min": "$year"}, "max": {"$max": "$year"}}},
        ]
    ).to_list(1)
    by_year_rows = await coll.aggregate(
        [{"$group": {"_id": "$year", "n": {"$sum": 1}}}, {"$sort": {"_id": 1}}]
    ).to_list(None)
    mm = minmax[0] if minmax else {}
    return {
        "count": int(count),
        "min_year": mm.get("min"),
        "max_year": mm.get("max"),
        "by_year": {str(r["_id"]): r["n"] for r in by_year_rows},
    }


# ── Filter / sort builders ─────────────────────────────────────────────────────


def _build_filter(query: dict[str, str | None]) -> dict:
    clauses: list[dict] = []

    search = (query.get("search") or "").strip()
    if search:
        rx = {"$regex": re.escape(search), "$options": "i"}
        clauses.append(
            {"$or": [{"title_ru": rx}, {"title_en": rx}, {"title_jp": rx}]}
        )

    if statuses := _split(query.get("status")):
        clauses.append({"status": {"$in": statuses}})
    if types := _split(query.get("type")):
        clauses.append({"type": {"$in": types}})
    if seasons := _split(query.get("season")):
        clauses.append({"season": {"$in": seasons}})
    if ratings := _split(query.get("age_rating")):
        clauses.append({"rating_mpaa": {"$in": ratings}})
    if genres := _split(query.get("genres") or query.get("genre")):
        clauses.append({"genres": {"$in": genres}})

    year: dict[str, int] = {}
    if (yf := _to_int(query.get("year_from") or query.get("yearFrom"))) is not None:
        year["$gte"] = yf
    if (yt := _to_int(query.get("year_to") or query.get("yearTo"))) is not None:
        year["$lte"] = yt
    if year:
        clauses.append({"year": year})

    clauses.append(_KODIK_VISIBLE)  # always hide confirmed-no-Kodik
    return {"$and": clauses}


def _sort_spec(query: dict[str, str | None]) -> tuple[list, dict | None]:
    sort = str(query.get("sort") or "")
    desc = (query.get("direction") or query.get("order")) != "asc"
    d = DESCENDING if desc else ASCENDING

    if sort == "rating":
        return [("rating", d)], None
    if sort == "popularity":
        return [("score_count", d)], None
    if sort in ("novelty", "startDate"):
        return [("year", d), ("_id", d)], None
    if sort in ("date", "createdAt"):
        return [("_id", d)], None
    if sort == "title":
        # Titles read A→Z by default; collation gives case-insensitive order
        return [("title_ru", ASCENDING if desc else DESCENDING)], {
            "locale": "en",
            "strength": 2,
        }
    return _DEFAULT_SORT, None


def _split(value: str | None) -> list[str]:
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


def _to_int(value: str | None) -> int | None:
    try:
        return int(value or "")
    except (ValueError, TypeError):
        return None
