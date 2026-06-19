"""Persistent anime catalog storage (MongoDB collection `anime`).

Permanent: documents survive restarts and are only ever upserted, never
deleted by sync. `_id` is the Shikimori id (int). Read queries live in
anime_catalog_queries.py, focused lookups in anime_catalog_lookup.py.
"""

from datetime import UTC, datetime

from pymongo import UpdateOne

from src.db.mongo import get_db
from src.models import Anime

# status_rank for the catalog order: ongoing → released → announced
_STATUS_RANK = {"ongoing": 0, "released": 1}


def _status_rank(status: str) -> int:
    return _STATUS_RANK.get(status, 2)


def _anime_to_doc(anime: Anime, synced_at: str) -> dict:
    status = anime.get("status") or ""
    doc = {
        "_id": int(anime["id"]),
        "title_ru": anime.get("title_ru") or "",
        "title_en": anime.get("title_en") or "",
        "title_jp": anime.get("title_jp") or "",
        "poster_url": anime.get("poster_url") or "",
        "genres": list(anime.get("genres") or []),
        "studio": anime.get("studio") or "",
        "type": anime.get("type") or "",
        "status": status,
        "status_rank": _status_rank(status),
        "season": anime.get("season") or "",
        "year": int(anime.get("year") or 0),
        "episodes_total": int(anime.get("episodes_total") or 0),
        "episodes_aired": int(anime.get("episodes_aired") or 0),
        "rating": float(anime.get("rating") or 0),
        "score_count": int(anime.get("score_count") or 0),
        "url_shikimori": anime.get("url_shikimori") or "",
        "next_episode_at": anime.get("next_episode_at"),
        "rating_mpaa": anime.get("rating_mpaa"),
        "duration": anime.get("duration"),
        "updated_at": anime.get("updated_at") or synced_at,
        "synced_at": synced_at,
    }
    return doc


async def upsert_anime_catalog_item(anime: Anime) -> None:
    await upsert_anime_catalog_many([anime])


async def upsert_anime_catalog_many(items: list[Anime]) -> int:
    """Upsert items (never deletes). Returns the number of rows written."""
    if not items:
        return 0
    synced_at = datetime.now(tz=UTC).isoformat()
    ops: list[UpdateOne] = []
    for anime in items:
        try:
            doc = _anime_to_doc(anime, synced_at)
        except (KeyError, TypeError, ValueError):
            continue
        # Don't overwrite an existing description with an empty one.
        if not (anime.get("description") or ""):
            doc.pop("description", None)
        else:
            doc["description"] = anime["description"]
        ops.append(UpdateOne({"_id": doc["_id"]}, {"$set": doc}, upsert=True))
    if not ops:
        return 0
    await get_db().anime.bulk_write(ops, ordered=False)
    return len(ops)


async def mark_kodik_availability(kodik_ids: set[int]) -> dict:
    """Set has_kodik for the WHOLE catalog from a complete Kodik id set.

    ids present in Kodik → 1, everyone else → 0. Touches only the has_kodik
    fields. Caller must pass a COMPLETE set (a partial crawl would wrongly hide)."""
    coll = get_db().anime
    now = datetime.now(tz=UTC).isoformat()
    ids = [int(i) for i in kodik_ids]
    await coll.update_many(
        {"_id": {"$in": ids}},
        {"$set": {"has_kodik": 1, "has_kodik_checked_at": now}},
    )
    await coll.update_many(
        {"_id": {"$nin": ids}},
        {"$set": {"has_kodik": 0, "has_kodik_checked_at": now}},
    )
    with_kodik = await coll.count_documents({"has_kodik": 1})
    without = await coll.count_documents({"has_kodik": 0})
    return {"with": int(with_kodik), "without": int(without)}


async def save_anime_detail(anime: Anime) -> None:
    """Persist the full detail payload (roles, screenshots, source)."""
    await upsert_anime_catalog_many([anime])
    await get_db().anime.update_one(
        {"_id": int(anime["id"])},
        {
            "$set": {
                "source": anime.get("source") or "",
                "screenshots": list(anime.get("screenshots") or []),
                "directors": list(anime.get("directors") or []),
                "authors": list(anime.get("authors") or []),
                "characters": list(anime.get("characters") or []),
                "detailed_at": datetime.now(tz=UTC).isoformat(),
            }
        },
    )


def doc_to_anime(doc: dict) -> Anime:
    """Mongo document → Anime shape (id from _id; drops internal fields)."""
    anime: Anime = {
        "id": doc["_id"],
        "title_ru": doc.get("title_ru", ""),
        "title_en": doc.get("title_en", ""),
        "title_jp": doc.get("title_jp", ""),
        "poster_url": doc.get("poster_url", ""),
        "description": doc.get("description", ""),
        "genres": doc.get("genres") or [],
        "studio": doc.get("studio", ""),
        "type": doc.get("type", ""),
        "status": doc.get("status", ""),
        "year": doc.get("year", 0),
        "episodes_total": doc.get("episodes_total", 0),
        "episodes_aired": doc.get("episodes_aired", 0),
        "rating": doc.get("rating", 0),
        "score_count": doc.get("score_count", 0),
        "url_shikimori": doc.get("url_shikimori", ""),
        "updated_at": doc.get("updated_at", ""),
    }
    for key in ("season", "next_episode_at", "rating_mpaa", "duration",
                "source", "detailed_at"):
        if doc.get(key):
            anime[key] = doc[key]  # type: ignore[literal-required]
    for key in ("screenshots", "directors", "authors", "characters"):
        if doc.get(key):
            anime[key] = doc[key]  # type: ignore[literal-required]
    return anime
