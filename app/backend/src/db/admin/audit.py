"""Admin audit log (Mongo `audit_log` collection)."""

from datetime import UTC, datetime
from typing import Any

from src.db.mongo import get_db, to_oid


async def add_admin_audit_log(
    admin_user_id: object,
    action: str,
    target_type: str,
    target_id: str,
    metadata: dict[str, Any] | None = None,
) -> None:
    await get_db().audit_log.insert_one(
        {
            "admin_user_id": to_oid(admin_user_id),
            "action": action,
            "target_type": target_type,
            "target_id": str(target_id),
            "metadata": metadata or {},
            "created_at": datetime.now(tz=UTC).isoformat(),
        }
    )


async def list_admin_audit_logs(page: int = 1, limit: int = 30) -> dict[str, Any]:
    safe_page = max(1, page)
    safe_limit = max(1, min(limit, 100))
    offset = (safe_page - 1) * safe_limit
    db = get_db()

    total = await db.audit_log.count_documents({})
    logs = await db.audit_log.find({}).sort("_id", -1).skip(offset).limit(
        safe_limit
    ).to_list(None)

    admin_ids = list({log["admin_user_id"] for log in logs if log.get("admin_user_id")})
    names: dict = {}
    if admin_ids:
        async for u in db.users.find({"_id": {"$in": admin_ids}}, {"name": 1}):
            names[u["_id"]] = u.get("name", "")

    data = [
        {
            "id": str(log["_id"]),
            "admin_user_id": str(log.get("admin_user_id"))
            if log.get("admin_user_id")
            else None,
            "admin_name": names.get(log.get("admin_user_id"), ""),
            "action": log.get("action", ""),
            "target_type": log.get("target_type", ""),
            "target_id": log.get("target_id", ""),
            "metadata": log.get("metadata", {}),
            "created_at": log.get("created_at", ""),
        }
        for log in logs
    ]
    return {"data": data, "total": total, "page": safe_page}
