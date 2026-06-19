"""Focused lookups over the `anime` collection."""

import re

from pymongo import ASCENDING, DESCENDING

from src.db.anime_catalog import doc_to_anime
from src.db.anime_catalog_queries import _KODIK_VISIBLE, _LIGHT_PROJECTION
from src.db.mongo import get_db
from src.models import Anime

_SEASON_MARKERS_RE = re.compile(
    r"\b(\d+(st|nd|rd|th)?\s*season|season\s*\d+|part\s*\d+)\b",
    re.IGNORECASE,
)
_RU_TRAILING_SEASON_RE = re.compile(r"\s+\d+\s*$")
_NON_WORD_RE = re.compile(r"[^\w]+", re.UNICODE)


def _family_key(anime: Anime) -> str:
    title = anime.get("title_en") or anime.get("title_ru") or ""
    title = title.replace("[", " ").replace("]", " ")
    title = _SEASON_MARKERS_RE.sub(" ", title)
    title = _RU_TRAILING_SEASON_RE.sub("", title)
    title = _NON_WORD_RE.sub(" ", title.lower())
    return " ".join(title.split())


async def get_anime_catalog_by_ids(
    anime_ids: list[int], visible_only: bool = True
) -> dict[int, Anime]:
    """Batch fetch by ids (light projection).

    `visible_only=True` (default) hides confirmed-no-Kodik titles — right for
    related/discovery. Pass False for watchlist/library so a user's saved title
    is returned even when it's hidden from listings (mirrors detail-by-id).
    """
    ids: list[int] = []
    for anime_id in anime_ids:
        try:
            value = int(anime_id)
        except (TypeError, ValueError):
            continue
        if value > 0 and value not in ids:
            ids.append(value)
    if not ids:
        return {}
    query: dict = {"_id": {"$in": ids}}
    if visible_only:
        query = {"$and": [query, _KODIK_VISIBLE]}
    cursor = get_db().anime.find(query, _LIGHT_PROJECTION)
    return {doc["_id"]: doc_to_anime(doc) async for doc in cursor}


async def get_anime_catalog_by_studio(studio_name: str) -> list[Anime]:
    name = studio_name.strip()
    if not name:
        return []
    cursor = (
        get_db()
        .anime.find(
            {
                "$and": [
                    {"studio": {"$regex": f"^{re.escape(name)}$", "$options": "i"}},
                    _KODIK_VISIBLE,
                ]
            },
            _LIGHT_PROJECTION,
        )
        .sort([("status_rank", ASCENDING), ("year", DESCENDING), ("rating", DESCENDING)])
    )
    return [doc_to_anime(doc) async for doc in cursor]


async def get_anime_catalog_title_family(anime_id: int) -> list[Anime]:
    """Locally known titles from the same numbered/season family."""
    try:
        current_id = int(anime_id)
    except (TypeError, ValueError):
        return []
    cursor = get_db().anime.find(
        {"$and": [{"$or": [{"title_en": {"$ne": ""}}, {"title_ru": {"$ne": ""}}], }, _KODIK_VISIBLE]},
        _LIGHT_PROJECTION,
    )
    items = [doc_to_anime(doc) async for doc in cursor]
    current = next((item for item in items if item["id"] == current_id), None)
    if not current:
        return []
    key = _family_key(current)
    if len(key) < 4:
        return []
    family = [
        item
        for item in items
        if item["id"] != current_id and _family_key(item) == key
    ]
    return sorted(family, key=lambda i: (i.get("year") or 9999, i.get("id") or 0))


async def get_upcoming_anime_from_catalog(limit_days: int) -> list[Anime]:
    cursor = (
        get_db()
        .anime.find(
            {"$and": [{"next_episode_at": {"$nin": [None, ""]}}, _KODIK_VISIBLE]},
            _LIGHT_PROJECTION,
        )
        .sort("next_episode_at", ASCENDING)
        .limit(max(limit_days, 1) * 50)
    )
    return [doc_to_anime(doc) async for doc in cursor]
