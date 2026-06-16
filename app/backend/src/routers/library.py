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


def _current_user(authorization: str | None) -> dict:
    try:
        return get_current_user(_bearer(authorization))
    except AuthError as error:
        raise HTTPException(
            status_code=401,
            detail={"code": error.code, "message": error.message},
        ) from error


@router.get("/watchlist")
async def watchlist(authorization: str | None = Header(default=None)) -> list[dict]:
    user = _current_user(authorization)
    return await get_user_watchlist(user["id"])


@router.get("/users/{user_id}/watchlist")
async def public_user_watchlist(user_id: int) -> list[dict]:
    return await get_user_watchlist(user_id)


@router.post("/watchlist/toggle")
async def watchlist_toggle(
    body: WatchlistToggleRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _current_user(authorization)
    return await toggle_user_watchlist_status(user["id"], body.model_dump())


@router.post("/watchlist")
async def watchlist_upsert(
    body: WatchlistToggleRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    return await watchlist_toggle(body, authorization)


@router.delete("/watchlist/{anime_id}")
def watchlist_delete(
    anime_id: int,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _current_user(authorization)
    return delete_user_watchlist_anime(user["id"], anime_id)


@router.get("/progress/{anime_id}")
def progress_for_anime(anime_id: int) -> list[dict]:
    return get_progress(anime_id)


@router.post("/progress")
def progress_upsert(body: ProgressRequest) -> dict:
    return upsert_progress(body.model_dump())


@router.get("/settings")
def current_settings() -> dict:
    return get_app_settings()


@router.put("/settings")
def settings_update(body: SettingsRequest | None = None) -> dict:
    data = body.model_dump(exclude_unset=True) if body else {}
    return {"success": True, "settings": merge_settings(data)}


@router.get("/notifications")
def notifications(unread_only: str | None = None) -> list[dict]:
    return get_notifications(unread_only == "true")


@router.post("/notifications/{notification_id}/read")
def notification_read(notification_id: str) -> dict:
    return mark_notification_read(notification_id)
