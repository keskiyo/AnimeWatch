"""Admin user management (Mongo). Operates on the `users` collection."""

import re
from datetime import UTC, datetime
from typing import Any

from src.db.mongo import get_db, to_oid


def _admin_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "avatar_url": doc.get("avatar_url", ""),
        "role": doc.get("role", "user"),
        "created_at": doc.get("created_at", ""),
        "is_blocked": int(doc.get("is_blocked", 0)),
        "blocked_at": doc.get("blocked_at", ""),
        "last_seen_at": doc.get("last_seen_at", ""),
    }


async def list_admin_users(
    search: str = "",
    role: str = "",
    blocked: str = "",
    page: int = 1,
    limit: int = 30,
) -> dict[str, Any]:
    safe_page = max(page, 1)
    safe_limit = min(max(limit, 1), 100)
    offset = (safe_page - 1) * safe_limit
    query = _build_filter(search, role, blocked)
    coll = get_db().users

    total = await coll.count_documents(query)
    cursor = coll.find(query).sort("_id", -1).skip(offset).limit(safe_limit)
    data = [_admin_user(doc) async for doc in cursor]
    return {"data": data, "total": total, "page": safe_page}


async def set_admin_user_role(user_id: object, role: str) -> dict | None:
    await get_db().users.update_one({"_id": to_oid(user_id)}, {"$set": {"role": role}})
    return await _get_admin_user(user_id)


async def set_admin_user_blocked(user_id: object, is_blocked: bool) -> dict | None:
    blocked_at = datetime.now(tz=UTC).isoformat() if is_blocked else ""
    await get_db().users.update_one(
        {"_id": to_oid(user_id)},
        {"$set": {"is_blocked": int(is_blocked), "blocked_at": blocked_at}},
    )
    return await _get_admin_user(user_id)


async def is_user_blocked(user_id: object) -> bool:
    doc = await get_db().users.find_one(
        {"_id": to_oid(user_id)}, {"is_blocked": 1}
    )
    return bool(doc and doc.get("is_blocked"))


async def touch_user_last_seen(user_id: object) -> None:
    await get_db().users.update_one(
        {"_id": to_oid(user_id)},
        {"$set": {"last_seen_at": datetime.now(tz=UTC).isoformat()}},
    )


async def _get_admin_user(user_id: object) -> dict | None:
    doc = await get_db().users.find_one({"_id": to_oid(user_id)})
    return _admin_user(doc) if doc else None


def _build_filter(search: str, role: str, blocked: str) -> dict[str, Any]:
    clauses: list[dict] = []
    query = search.strip()
    if query:
        rx = {"$regex": re.escape(query), "$options": "i"}
        ors: list[dict] = [{"name": rx}, {"email": rx}]
        oid = to_oid(query)
        if oid is not None:
            ors.append({"_id": oid})
        clauses.append({"$or": ors})
    if role in {"user", "admin"}:
        clauses.append({"role": role})
    if blocked in {"0", "1"}:
        clauses.append({"is_blocked": int(blocked)})
    return {"$and": clauses} if clauses else {}
