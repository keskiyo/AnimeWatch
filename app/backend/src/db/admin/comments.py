"""Admin moderation queries over comments (list with author + anime title). Mongo."""

from typing import Any

from src.db.mongo import get_db


async def list_admin_comments(page: int = 1, limit: int = 30) -> dict[str, Any]:
    """Newest-first comments with author and anime title, paginated."""
    safe_page = max(page, 1)
    safe_limit = min(max(limit, 1), 100)
    offset = (safe_page - 1) * safe_limit
    db = get_db()

    total = await db.comments.count_documents({})
    docs = await db.comments.find({}).sort("_id", -1).skip(offset).limit(
        safe_limit
    ).to_list(None)

    user_ids = list({d["user_id"] for d in docs if d.get("user_id")})
    anime_ids = list({d["anime_id"] for d in docs if d.get("anime_id") is not None})
    users: dict = {}
    if user_ids:
        async for u in db.users.find({"_id": {"$in": user_ids}}):
            users[u["_id"]] = u
    titles: dict = {}
    if anime_ids:
        async for a in db.anime.find(
            {"_id": {"$in": anime_ids}}, {"title_ru": 1, "title_en": 1}
        ):
            titles[a["_id"]] = a.get("title_ru") or a.get("title_en") or ""

    data = []
    for d in docs:
        user = users.get(d.get("user_id")) or {}
        parent = d.get("parent_id")
        data.append(
            {
                "id": str(d["_id"]),
                "anime_id": d.get("anime_id"),
                "user_id": str(d.get("user_id")),
                "parent_id": str(parent) if parent else None,
                "text": d.get("text", ""),
                "created_at": d.get("created_at", ""),
                "username": user.get("name", ""),
                "user_avatar": user.get("avatar_url", ""),
                "anime_title": titles.get(d.get("anime_id"), ""),
            }
        )
    return {"data": data, "total": total, "page": safe_page}
