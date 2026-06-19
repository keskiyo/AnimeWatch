"""Watchlist category business logic."""

from datetime import UTC, datetime

from src.db.anime_catalog_lookup import get_anime_catalog_by_ids
from src.db.user.watchlist import (
    VALID_WATCHLIST_STATUSES,
    delete_watchlist_anime,
    list_user_anime_statuses,
    list_user_watchlist,
    toggle_watchlist_status,
)
from src.services.catalog.catalog import get_anime_by_id


async def get_user_watchlist(user_id: object) -> list[dict]:
    items = await list_user_watchlist(user_id)
    await _attach_anime(items)
    return items


async def toggle_user_watchlist_status(user_id: object, input_data: dict) -> dict:
    anime_id = _require_anime_id(input_data)
    status = str(input_data.get("status") or "")
    if status not in VALID_WATCHLIST_STATUSES:
        raise ValueError(f"status must be one of {sorted(VALID_WATCHLIST_STATUSES)}")

    active = await toggle_watchlist_status(user_id, anime_id, status, _now())
    statuses = await list_user_anime_statuses(user_id, anime_id)
    anime = await get_anime_by_id(anime_id)
    return {
        "user_id": str(user_id),
        "anime_id": anime_id,
        "status": status,
        "active": active,
        "statuses": statuses,
        "anime": anime,
    }


async def delete_user_watchlist_anime(user_id: object, anime_id: int) -> dict:
    await delete_watchlist_anime(user_id, anime_id)
    return {"success": True}


async def _attach_anime(items: list[dict]) -> None:
    # One batched query instead of one round-trip per item. visible_only=False:
    # a saved title stays shown even if hidden from listings (has_kodik=0).
    by_id = await get_anime_catalog_by_ids(
        [item["anime_id"] for item in items], visible_only=False
    )
    for item in items:
        item["anime"] = by_id.get(item["anime_id"])


def _require_anime_id(input_data: dict) -> int:
    try:
        anime_id = int(input_data.get("anime_id") or 0)
    except (TypeError, ValueError):
        anime_id = 0
    if anime_id <= 0:
        raise ValueError("anime_id must be a positive integer")
    return anime_id


def _now() -> str:
    return datetime.now(tz=UTC).isoformat().replace("+00:00", "Z")
