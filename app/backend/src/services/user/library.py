import asyncio
from datetime import UTC, datetime

from src.config import get_settings
from src.db.library import LibraryStore
from src.services.catalog import get_anime_by_id

VALID_WATCHLIST_STATUSES = {"watching", "planned", "completed", "dropped"}

DEFAULT_SETTINGS = {
    "default_player": "auto",
    "default_quality": "auto",
    "default_dubbing": "auto",
    "theme": "dark",
    "notifications_enabled": True,
    "cache_size_limit": 512,
}

_SETTINGS_KEY = "app_settings"
_store_by_path: dict[str, LibraryStore] = {}


def _store() -> LibraryStore:
    path = get_settings().database_path
    if path not in _store_by_path:
        _store_by_path[path] = LibraryStore(path)
    return _store_by_path[path]


# ── Watchlist ─────────────────────────────────────────────────────────────────

async def get_watchlist() -> list[dict]:
    items = _store().list_watchlist()
    animes = await asyncio.gather(
        *[get_anime_by_id(item["anime_id"]) for item in items]
    )
    for item, anime in zip(items, animes, strict=True):
        item["anime"] = anime
    return items


async def upsert_watchlist_item(input_data: dict) -> dict:
    anime_id = _require_anime_id(input_data)
    status = input_data.get("status")
    if status not in VALID_WATCHLIST_STATUSES:
        raise ValueError(f"status must be one of {sorted(VALID_WATCHLIST_STATUSES)}")
    favorite = bool(input_data.get("favorite"))

    store = _store()
    existing = store.get_watchlist_item(anime_id)
    item = {
        "anime_id": anime_id,
        "added_at": existing["added_at"] if existing else _now(),
        "status": status,
        "favorite": favorite,
        "notifications_enabled": existing["notifications_enabled"] if existing else True,
        "last_watched_episode": existing["last_watched_episode"] if existing else None,
    }
    store.upsert_watchlist_item(
        anime_id=item["anime_id"],
        added_at=item["added_at"],
        status=item["status"],
        favorite=item["favorite"],
        notifications_enabled=item["notifications_enabled"],
        last_watched_episode=item["last_watched_episode"],
    )
    item["anime"] = await get_anime_by_id(anime_id)
    return item


def delete_watchlist_item(anime_id: int) -> dict:
    _store().delete_watchlist_item(anime_id)
    return {"success": True}


# ── Progress ──────────────────────────────────────────────────────────────────

def get_progress(anime_id: int) -> list[dict]:
    return _store().list_progress(anime_id)


def upsert_progress(input_data: dict) -> dict:
    anime_id = _require_anime_id(input_data)
    episode_number = int(input_data.get("episode_number") or 0)
    if episode_number <= 0:
        raise ValueError("episode_number must be a positive integer")
    watched = bool(input_data.get("watched"))
    watched_at = _now() if watched else None

    store = _store()
    store.upsert_progress(anime_id, episode_number, watched, watched_at)
    if watched:
        store.set_last_watched_episode(anime_id, episode_number)
    return {
        "anime_id": anime_id,
        "episode_number": episode_number,
        "watched": watched,
        "watched_at": watched_at,
    }


# ── Settings ──────────────────────────────────────────────────────────────────

def get_app_settings() -> dict:
    stored = _store().get_value(_SETTINGS_KEY)
    if isinstance(stored, dict):
        return {**DEFAULT_SETTINGS, **stored}
    return dict(DEFAULT_SETTINGS)


def merge_settings(input_data: dict) -> dict:
    merged = {
        "default_player": input_data.get("default_player") if input_data.get("default_player") in ["auto", "kodik"] else "auto",
        "default_quality": input_data.get("default_quality") if input_data.get("default_quality") in ["auto", "360p", "480p", "720p", "1080p"] else "auto",
        "default_dubbing": input_data.get("default_dubbing") if isinstance(input_data.get("default_dubbing"), str) and input_data.get("default_dubbing") else "auto",
        "theme": "dark",
        "notifications_enabled": input_data.get("notifications_enabled") if isinstance(input_data.get("notifications_enabled"), bool) else True,
        "cache_size_limit": _cache_limit(input_data.get("cache_size_limit")),
    }
    _store().set_value(_SETTINGS_KEY, merged)
    return merged


# ── Notifications ─────────────────────────────────────────────────────────────

def get_notifications(unread_only: bool) -> list[dict]:
    return _store().list_notifications(unread_only)


def mark_notification_read(notification_id: str) -> dict:
    _store().mark_notification_read(notification_id)
    return {"success": True}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_anime_id(input_data: dict) -> int:
    try:
        anime_id = int(input_data.get("anime_id") or 0)
    except (TypeError, ValueError):
        anime_id = 0
    if anime_id <= 0:
        raise ValueError("anime_id must be a positive integer")
    return anime_id


def _cache_limit(value: object) -> int:
    return min(max(round(value), 64), 4096) if isinstance(value, int | float) else 512


def _now() -> str:
    return datetime.now(tz=UTC).isoformat().replace("+00:00", "Z")
