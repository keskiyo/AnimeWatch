"""Per-user anime category lists. Mongo `watchlist` (one status per user+anime)."""

from src.db.mongo import get_db, to_oid

VALID_WATCHLIST_STATUSES = {
    "watching",
    "plan_to_watch",
    "completed",
    "on_hold",
    "dropped",
}


def _row(doc: dict) -> dict:
    return {
        "user_id": str(doc.get("user_id")),
        "anime_id": doc.get("anime_id"),
        "status": doc.get("status"),
        "added_at": doc.get("added_at"),
    }


async def list_user_watchlist(user_id: object) -> list[dict]:
    cursor = (
        get_db()
        .watchlist.find({"user_id": to_oid(user_id)})
        .sort("added_at", -1)
    )
    return [_row(doc) async for doc in cursor]


async def list_user_anime_statuses(user_id: object, anime_id: int) -> list[str]:
    cursor = get_db().watchlist.find(
        {"user_id": to_oid(user_id), "anime_id": int(anime_id)}
    )
    return [doc["status"] async for doc in cursor if doc.get("status")]


async def toggle_watchlist_status(
    user_id: object, anime_id: int, status: str, added_at: str
) -> bool:
    uid, aid = to_oid(user_id), int(anime_id)
    coll = get_db().watchlist
    existing = await coll.find_one({"user_id": uid, "anime_id": aid})
    if existing and existing.get("status") == status:
        await coll.delete_one({"user_id": uid, "anime_id": aid})
        return False
    await coll.update_one(
        {"user_id": uid, "anime_id": aid},
        {"$set": {"status": status, "added_at": added_at}},
        upsert=True,
    )
    return True


async def delete_watchlist_anime(user_id: object, anime_id: int) -> None:
    await get_db().watchlist.delete_one(
        {"user_id": to_oid(user_id), "anime_id": int(anime_id)}
    )
