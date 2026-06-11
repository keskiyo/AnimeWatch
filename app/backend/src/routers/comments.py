"""Per-anime comments: list (public), create/reply/edit/delete/vote (auth)."""

from fastapi import APIRouter, Body, Header, HTTPException

from src.config import get_settings
from src.db.comments import (
    add_comment,
    delete_comment,
    ensure_comments_schema,
    get_comment,
    get_vote_totals,
    list_comments,
    set_vote,
    update_comment,
)
from src.services.auth import AuthError, get_current_user

router = APIRouter(prefix="/api", tags=["comments"])

MAX_COMMENT_LENGTH = 2000


def _db() -> str:
    db = get_settings().database_path
    ensure_comments_schema(db)
    return db


def _token(authorization: str | None) -> str | None:
    if authorization and authorization.startswith("Bearer "):
        return authorization.removeprefix("Bearer ").strip()
    return None


def _user_from(authorization: str | None) -> dict:
    try:
        return get_current_user(_token(authorization))
    except AuthError as error:
        raise HTTPException(
            status_code=401, detail={"code": error.code, "message": error.message}
        ) from error


def _optional_user(authorization: str | None) -> dict | None:
    try:
        return get_current_user(_token(authorization))
    except AuthError:
        return None


def _validated_text(body: dict) -> str:
    text = str(body.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="Комментарий пустой")
    if len(text) > MAX_COMMENT_LENGTH:
        raise HTTPException(status_code=422, detail="Комментарий слишком длинный")
    return text


@router.get("/animes/{anime_id}/comments")
def anime_comments(
    anime_id: int, authorization: str | None = Header(default=None)
) -> list[dict]:
    """Public list; with a token the viewer's own votes (my_vote) are included."""
    viewer = _optional_user(authorization)
    return list_comments(_db(), anime_id, viewer["id"] if viewer else None)


@router.post("/animes/{anime_id}/comments", status_code=201)
def create_comment(
    anime_id: int,
    body: dict = Body(...),
    authorization: str | None = Header(default=None),
) -> dict:
    user = _user_from(authorization)
    text = _validated_text(body)
    db = _db()

    # Replies: parent must exist, belong to the same anime, and be top-level
    parent_id = body.get("parent_id")
    if parent_id is not None:
        parent = get_comment(db, int(parent_id))
        if not parent or parent["anime_id"] != anime_id:
            raise HTTPException(status_code=422, detail="Родительский комментарий не найден")
        if parent.get("parent_id"):
            parent_id = parent["parent_id"]  # keep threads one level deep

    comment_id = add_comment(db, anime_id, user["id"], text, parent_id)
    return {
        "id": comment_id,
        "anime_id": anime_id,
        "user_id": user["id"],
        "parent_id": parent_id,
        "username": user["name"],
        "avatar_url": user["avatar_url"],
        "text": text,
        "likes": 0,
        "dislikes": 0,
        "my_vote": 0,
    }


@router.post("/comments/{comment_id}/vote")
def vote_comment(
    comment_id: int,
    body: dict = Body(...),
    authorization: str | None = Header(default=None),
) -> dict:
    """value: 1 — like, -1 — dislike, 0 — remove my vote."""
    user = _user_from(authorization)
    value = body.get("value")
    if value not in (1, -1, 0):
        raise HTTPException(status_code=422, detail="value должен быть 1, -1 или 0")
    db = _db()
    if not get_comment(db, comment_id):
        raise HTTPException(status_code=404, detail="Комментарий не найден")
    set_vote(db, comment_id, user["id"], int(value))
    return {**get_vote_totals(db, comment_id), "my_vote": value}


@router.put("/comments/{comment_id}")
def edit_comment(
    comment_id: int,
    body: dict = Body(...),
    authorization: str | None = Header(default=None),
) -> dict:
    """Edit own comment — ONLY the author can edit (admins may only delete)."""
    user = _user_from(authorization)
    db = _db()
    comment = get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Комментарий не найден")
    if comment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Нет прав на редактирование")
    text = _validated_text(body)
    update_comment(db, comment_id, text)
    return {**comment, "text": text, "username": user["name"], "avatar_url": user["avatar_url"]}


@router.delete("/comments/{comment_id}")
def remove_comment(
    comment_id: int,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _user_from(authorization)
    db = _db()
    comment = get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Комментарий не найден")
    if comment["user_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Нет прав на удаление")
    delete_comment(db, comment_id)
    return {"success": True}
