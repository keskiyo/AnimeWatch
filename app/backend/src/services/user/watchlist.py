"""Watchlist category business logic."""

import asyncio
from datetime import UTC, datetime

from src.config import get_settings
from src.db.user.watchlist import (
    VALID_WATCHLIST_STATUSES,
    delete_watchlist_anime,
    list_user_anime_statuses,
    list_user_watchlist,
    toggle_watchlist_status,
)
from src.services.catalog.catalog import get_anime_by_id


async def get_user_watchlist(user_id: int) -> list[dict]:
    items = await asyncio.to_thread(list_user_watchlist, _db(), user_id)
    await _attach_anime(items)
    return items


async def toggle_user_watchlist_status(user_id: int, input_data: dict) -> dict:
    anime_id = _require_anime_id(input_data)
    status = str(input_data.get("status") or "")
    if status not in VALID_WATCHLIST_STATUSES:
        raise ValueError(f"status must be one of {sorted(VALID_WATCHLIST_STATUSES)}")

    active = await asyncio.to_thread(toggle_watchlist_status, _db(), user_id, anime_id, status, _now())
    statuses = await asyncio.to_thread(list_user_anime_statuses, _db(), user_id, anime_id)
    anime = await get_anime_by_id(anime_id)
    return {
        "user_id": user_id,
        "anime_id": anime_id,
        "status": status,
        "active": active,
        "statuses": statuses,
        "anime": anime,
    }


def delete_user_watchlist_anime(user_id: int, anime_id: int) -> dict:
    delete_watchlist_anime(_db(), user_id, anime_id)
    return {"success": True}


async def _attach_anime(items: list[dict]) -> None:
    animes = await asyncio.gather(
        *[get_anime_by_id(item["anime_id"]) for item in items]
    )
    for item, anime in zip(items, animes, strict=True):
        item["anime"] = anime


def _require_anime_id(input_data: dict) -> int:
    try:
        anime_id = int(input_data.get("anime_id") or 0)
    except (TypeError, ValueError):
        anime_id = 0
    if anime_id <= 0:
        raise ValueError("anime_id must be a positive integer")
    return anime_id


def _db() -> str:
    return get_settings().database_path


def _now() -> str:
    return datetime.now(tz=UTC).isoformat().replace("+00:00", "Z")
