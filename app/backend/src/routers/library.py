"""User library routes: watchlist, progress, settings, notifications."""

from fastapi import APIRouter, Body, HTTPException

from src.services.library import (
    delete_watchlist_item,
    get_app_settings,
    get_notifications,
    get_progress,
    get_watchlist,
    mark_notification_read,
    merge_settings,
    upsert_progress,
    upsert_watchlist_item,
)

router = APIRouter(prefix="/api", tags=["library"])


@router.get("/watchlist")
async def watchlist() -> list[dict]:
    return await get_watchlist()


@router.post("/watchlist")
async def watchlist_upsert(body: dict = Body(...)) -> dict:
    try:
        return await upsert_watchlist_item(body)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.delete("/watchlist/{anime_id}")
def watchlist_delete(anime_id: int) -> dict:
    return delete_watchlist_item(anime_id)


@router.get("/progress/{anime_id}")
def progress_for_anime(anime_id: int) -> list[dict]:
    return get_progress(anime_id)


@router.post("/progress")
def progress_upsert(body: dict = Body(...)) -> dict:
    try:
        return upsert_progress(body)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/settings")
def current_settings() -> dict:
    return get_app_settings()


@router.put("/settings")
def settings_update(body: dict = Body(default_factory=dict)) -> dict:
    return {"success": True, "settings": merge_settings(body)}


@router.get("/notifications")
def notifications(unread_only: str | None = None) -> list[dict]:
    return get_notifications(unread_only == "true")


@router.post("/notifications/{notification_id}/read")
def notification_read(notification_id: str) -> dict:
    return mark_notification_read(notification_id)
