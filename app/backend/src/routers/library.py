"""User library routes: watchlist, progress, settings, notifications."""

from fastapi import APIRouter, Header, HTTPException

from src.schemas.requests import ProgressRequest, SettingsRequest, WatchlistToggleRequest
from src.services.user.auth import AuthError, get_current_user
from src.services.user.library import (
    get_app_settings,
    get_notifications,
    get_progress,
    mark_notification_read,
    merge_settings,
    upsert_progress,
)
from src.services.user.watchlist import (
    delete_user_watchlist_anime,
    get_user_watchlist,
    toggle_user_watchlist_status,
)

router = APIRouter(prefix="/api", tags=["library"])


def _bearer(authorization: str | None) -> str | None:
    if authorization and authorization.startswith("Bearer "):
        return authorization.removeprefix("Bearer ").strip()
    return None


async def _current_user(authorization: str | None) -> dict:
    try:
        return await get_current_user(_bearer(authorization))
    except AuthError as error:
        raise HTTPException(
            status_code=401,
            detail={"code": error.code, "message": error.message},
        ) from error


@router.get("/watchlist")
async def watchlist(authorization: str | None = Header(default=None)) -> list[dict]:
    user = await _current_user(authorization)
    return await get_user_watchlist(user["id"])


@router.get("/users/{user_id}/watchlist")
async def public_user_watchlist(user_id: str) -> list[dict]:
    return await get_user_watchlist(user_id)


@router.post("/watchlist/toggle")
async def watchlist_toggle(
    body: WatchlistToggleRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = await _current_user(authorization)
    return await toggle_user_watchlist_status(user["id"], body.model_dump())


@router.post("/watchlist")
async def watchlist_upsert(
    body: WatchlistToggleRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    return await watchlist_toggle(body, authorization)


@router.delete("/watchlist/{anime_id}")
async def watchlist_delete(
    anime_id: int,
    authorization: str | None = Header(default=None),
) -> dict:
    user = await _current_user(authorization)
    return await delete_user_watchlist_anime(user["id"], anime_id)


@router.get("/progress/{anime_id}")
async def progress_for_anime(
    anime_id: int, authorization: str | None = Header(default=None)
) -> list[dict]:
    user = await _current_user(authorization)
    return await get_progress(user["id"], anime_id)


@router.post("/progress")
async def progress_upsert(
    body: ProgressRequest, authorization: str | None = Header(default=None)
) -> dict:
    user = await _current_user(authorization)
    return await upsert_progress(user["id"], body.model_dump())


@router.get("/settings")
async def current_settings(
    authorization: str | None = Header(default=None),
) -> dict:
    user = await _current_user(authorization)
    return await get_app_settings(user["id"])


@router.put("/settings")
async def settings_update(
    body: SettingsRequest | None = None,
    authorization: str | None = Header(default=None),
) -> dict:
    user = await _current_user(authorization)
    data = body.model_dump(exclude_unset=True) if body else {}
    return {"success": True, "settings": await merge_settings(user["id"], data)}


@router.get("/notifications")
async def notifications(
    unread_only: str | None = None,
    authorization: str | None = Header(default=None),
) -> list[dict]:
    user = await _current_user(authorization)
    return await get_notifications(user["id"], unread_only == "true")


@router.post("/notifications/{notification_id}/read")
async def notification_read(
    notification_id: str, authorization: str | None = Header(default=None)
) -> dict:
    user = await _current_user(authorization)
    return await mark_notification_read(user["id"], notification_id)
