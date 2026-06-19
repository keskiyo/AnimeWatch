"""Per-anime comments + embedded votes + replies (parent_id tree). Mongo."""

from datetime import UTC, datetime

from src.db.mongo import get_db, to_oid


def _now() -> str:
    return datetime.now(tz=UTC).isoformat()


async def add_comment(
    anime_id: int, user_id: object, text: str, parent_id: object | None = None
) -> str:
    doc = {
        "anime_id": int(anime_id),
        "user_id": to_oid(user_id),
        "parent_id": to_oid(parent_id) if parent_id else None,
        "text": text,
        "created_at": _now(),
        "votes": [],
    }
    result = await get_db().comments.insert_one(doc)
    return str(result.inserted_id)


def _shape(doc: dict, viewer_id: object | None, user: dict | None) -> dict:
    votes = doc.get("votes") or []
    viewer = to_oid(viewer_id) if viewer_id else None
    my_vote = 0
    likes = dislikes = 0
    for v in votes:
        if v.get("value") == 1:
            likes += 1
        elif v.get("value") == -1:
            dislikes += 1
        if viewer is not None and v.get("user_id") == viewer:
            my_vote = v.get("value", 0)
    parent = doc.get("parent_id")
    return {
        "id": str(doc["_id"]),
        "anime_id": doc.get("anime_id"),
        "user_id": str(doc.get("user_id")),
        "parent_id": str(parent) if parent else None,
        "text": doc.get("text", ""),
        "created_at": doc.get("created_at", ""),
        "username": (user or {}).get("name", ""),
        "avatar_url": (user or {}).get("avatar_url", ""),
        "likes": likes,
        "dislikes": dislikes,
        "my_vote": my_vote,
    }


async def list_comments(anime_id: int, viewer_id: object | None = None) -> list[dict]:
    """Newest first, with author profile, vote totals and the viewer's vote."""
    db = get_db()
    docs = await db.comments.find({"anime_id": int(anime_id)}).sort("_id", -1).to_list(None)
    user_ids = list({d["user_id"] for d in docs if d.get("user_id")})
    users = {}
    if user_ids:
        async for u in db.users.find({"_id": {"$in": user_ids}}):
            users[u["_id"]] = u
    return [_shape(d, viewer_id, users.get(d.get("user_id"))) for d in docs]


async def get_comment(comment_id: object) -> dict | None:
    oid = to_oid(comment_id)
    if oid is None:
        return None
    doc = await get_db().comments.find_one({"_id": oid})
    if not doc:
        return None
    parent = doc.get("parent_id")
    return {
        "id": str(doc["_id"]),
        "anime_id": doc.get("anime_id"),
        "user_id": str(doc.get("user_id")),
        "parent_id": str(parent) if parent else None,
        "text": doc.get("text", ""),
        "created_at": doc.get("created_at", ""),
    }


async def update_comment(comment_id: object, text: str) -> None:
    oid = to_oid(comment_id)
    if oid is not None:
        await get_db().comments.update_one({"_id": oid}, {"$set": {"text": text}})


async def delete_comment(comment_id: object) -> None:
    """Delete a comment and its WHOLE reply subtree (any depth)."""
    oid = to_oid(comment_id)
    if oid is None:
        return
    coll = get_db().comments
    to_delete = [oid]
    frontier = [oid]
    while frontier:
        children = await coll.find(
            {"parent_id": {"$in": frontier}}, {"_id": 1}
        ).to_list(None)
        frontier = [c["_id"] for c in children]
        to_delete.extend(frontier)
    await coll.delete_many({"_id": {"$in": to_delete}})


async def set_vote(comment_id: object, user_id: object, value: int) -> None:
    """value: 1 like, -1 dislike, 0 removes the vote."""
    oid, uid = to_oid(comment_id), to_oid(user_id)
    if oid is None or uid is None:
        return
    coll = get_db().comments
    await coll.update_one({"_id": oid}, {"$pull": {"votes": {"user_id": uid}}})
    if value != 0:
        await coll.update_one(
            {"_id": oid}, {"$push": {"votes": {"user_id": uid, "value": value}}}
        )


async def get_vote_totals(comment_id: object) -> dict:
    oid = to_oid(comment_id)
    doc = await get_db().comments.find_one({"_id": oid}, {"votes": 1}) if oid else None
    votes = (doc or {}).get("votes") or []
    return {
        "likes": sum(1 for v in votes if v.get("value") == 1),
        "dislikes": sum(1 for v in votes if v.get("value") == -1),
    }
