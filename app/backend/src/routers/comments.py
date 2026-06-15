"""Per-anime comments: list, create/reply/edit/delete/vote."""

from fastapi import APIRouter, Header, HTTPException

from src.config import get_settings
from src.db.comments import (
    add_comment,
    delete_comment,
    get_comment,
    get_vote_totals,
    list_comments,
    set_vote,
    update_comment,
)
from src.schemas.requests import CommentRequest, VoteRequest
from src.services.auth import AuthError, get_current_user

router = APIRouter(prefix="/api", tags=["comments"])


def _db() -> str:
    return get_settings().database_path


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


@router.get("/animes/{anime_id}/comments")
def anime_comments(
    anime_id: int, authorization: str | None = Header(default=None)
) -> list[dict]:
    viewer = _optional_user(authorization)
    return list_comments(_db(), anime_id, viewer["id"] if viewer else None)


@router.post("/animes/{anime_id}/comments", status_code=201)
def create_comment(
    anime_id: int,
    body: CommentRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _user_from(authorization)
    db = _db()
    parent_id = body.parent_id
    if parent_id is not None:
        parent = get_comment(db, parent_id)
        if not parent or parent["anime_id"] != anime_id:
            raise HTTPException(status_code=422, detail="Parent comment was not found")
        # Keep the real parent at any depth — deep (Reddit-style) threading.

    comment_id = add_comment(db, anime_id, user["id"], body.text, parent_id)
    return {
        "id": comment_id,
        "anime_id": anime_id,
        "user_id": user["id"],
        "parent_id": parent_id,
        "username": user["name"],
        "avatar_url": user["avatar_url"],
        "text": body.text,
        "likes": 0,
        "dislikes": 0,
        "my_vote": 0,
    }


@router.post("/comments/{comment_id}/vote")
def vote_comment(
    comment_id: int,
    body: VoteRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _user_from(authorization)
    db = _db()
    if not get_comment(db, comment_id):
        raise HTTPException(status_code=404, detail="Comment was not found")
    set_vote(db, comment_id, user["id"], int(body.value))
    return {**get_vote_totals(db, comment_id), "my_vote": body.value}


@router.put("/comments/{comment_id}")
def edit_comment(
    comment_id: int,
    body: CommentRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _user_from(authorization)
    db = _db()
    comment = get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment was not found")
    if comment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    update_comment(db, comment_id, body.text)
    return {**comment, "text": body.text, "username": user["name"], "avatar_url": user["avatar_url"]}


@router.delete("/comments/{comment_id}")
def remove_comment(
    comment_id: int,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _user_from(authorization)
    db = _db()
    comment = get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment was not found")
    if comment["user_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    delete_comment(db, comment_id)
    return {"success": True}
