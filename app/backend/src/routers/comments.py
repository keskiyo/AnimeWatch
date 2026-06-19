"""Per-anime comments: list, create/reply/edit/delete/vote."""

from fastapi import APIRouter, Header, HTTPException

from src.db.user.comments import (
    add_comment,
    delete_comment,
    get_comment,
    get_vote_totals,
    list_comments,
    set_vote,
    update_comment,
)
from src.schemas.requests import CommentRequest, VoteRequest
from src.services.user.auth import AuthError, get_current_user

router = APIRouter(prefix="/api", tags=["comments"])


def _token(authorization: str | None) -> str | None:
    if authorization and authorization.startswith("Bearer "):
        return authorization.removeprefix("Bearer ").strip()
    return None


async def _user_from(authorization: str | None) -> dict:
    try:
        return await get_current_user(_token(authorization))
    except AuthError as error:
        raise HTTPException(
            status_code=401, detail={"code": error.code, "message": error.message}
        ) from error


async def _optional_user(authorization: str | None) -> dict | None:
    try:
        return await get_current_user(_token(authorization))
    except AuthError:
        return None


@router.get("/animes/{anime_id}/comments")
async def anime_comments(
    anime_id: int, authorization: str | None = Header(default=None)
) -> list[dict]:
    viewer = await _optional_user(authorization)
    return await list_comments(anime_id, viewer["id"] if viewer else None)


@router.post("/animes/{anime_id}/comments", status_code=201)
async def create_comment(
    anime_id: int,
    body: CommentRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = await _user_from(authorization)
    parent_id = body.parent_id
    if parent_id is not None:
        parent = await get_comment(parent_id)
        if not parent or parent["anime_id"] != anime_id:
            raise HTTPException(status_code=422, detail="Parent comment was not found")
        # Keep the real parent at any depth — deep (Reddit-style) threading.

    comment_id = await add_comment(anime_id, user["id"], body.text, parent_id)
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
async def vote_comment(
    comment_id: str,
    body: VoteRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = await _user_from(authorization)
    if not await get_comment(comment_id):
        raise HTTPException(status_code=404, detail="Comment was not found")
    await set_vote(comment_id, user["id"], int(body.value))
    return {**await get_vote_totals(comment_id), "my_vote": body.value}


@router.put("/comments/{comment_id}")
async def edit_comment(
    comment_id: str,
    body: CommentRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = await _user_from(authorization)
    comment = await get_comment(comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment was not found")
    if comment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    await update_comment(comment_id, body.text)
    return {**comment, "text": body.text, "username": user["name"], "avatar_url": user["avatar_url"]}


@router.delete("/comments/{comment_id}")
async def remove_comment(
    comment_id: str,
    authorization: str | None = Header(default=None),
) -> dict:
    user = await _user_from(authorization)
    comment = await get_comment(comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment was not found")
    if comment["user_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    await delete_comment(comment_id)
    return {"success": True}
