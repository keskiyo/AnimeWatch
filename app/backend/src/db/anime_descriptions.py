from datetime import UTC, datetime

from src.db.mongo import get_db

_MISSING_DESCRIPTION = {
    "$or": [
        {"description": {"$exists": False}},
        {"description": ""},
        {"description": None},
    ]
}


async def list_anime_without_description(limit: int) -> list[dict]:
    safe_limit = max(1, min(limit, 500))
    cursor = (
        get_db()
        .anime.find(
            _MISSING_DESCRIPTION,
            {"title_ru": 1, "title_en": 1, "mal_id": 1},
        )
        .sort([("status_rank", 1), ("year", -1), ("_id", -1)])
        .limit(safe_limit)
    )
    return [doc async for doc in cursor]


async def set_anime_description(anime_id: int, description: str) -> bool:
    text = description.strip()
    if not text:
        return False
    result = await get_db().anime.update_one(
        {"$and": [{"_id": int(anime_id)}, _MISSING_DESCRIPTION]},
        {
            "$set": {
                "description": text,
                "description_source": "yummyanime",
                "description_updated_at": datetime.now(tz=UTC).isoformat(),
            }
        },
    )
    return result.modified_count > 0
