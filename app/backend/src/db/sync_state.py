"""Key-value sync state storage (which sync ran when, status, errors)."""

from datetime import UTC, datetime

from src.db.mongo import get_db


async def get_sync_state(key: str) -> str | None:
    doc = await get_db().sync_state.find_one({"_id": key})
    return doc.get("value") if doc else None


async def set_sync_state(key: str, value: str) -> None:
    await get_db().sync_state.update_one(
        {"_id": key},
        {"$set": {"value": value, "updated_at": datetime.now(tz=UTC).isoformat()}},
        upsert=True,
    )


async def get_all_sync_state() -> dict[str, str]:
    cursor = get_db().sync_state.find({})
    return {doc["_id"]: doc.get("value", "") async for doc in cursor}
