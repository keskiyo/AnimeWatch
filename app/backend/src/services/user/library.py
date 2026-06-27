"""Per-user library business logic: watch progress, settings, notifications.

Every function takes the authenticated `user_id` so data never leaks between
accounts. Per-category anime lists live in services/user/watchlist.py.
"""

from datetime import UTC, datetime

from src.db.user.library import LibraryStore

DEFAULT_SETTINGS = {
    "default_player": "auto",
    "default_quality": "auto",
    "default_dubbing": "auto",
    "theme": "dark",
    "notifications_enabled": True,
    "cache_size_limit": 512,
}

_SETTINGS_KEY = "app_settings"
_store_instance = LibraryStore()


def _store() -> LibraryStore:
    return _store_instance


# ── Progress ──────────────────────────────────────────────────────────────────


async def get_progress(user_id: object, anime_id: int) -> list[dict]:
    return await _store().list_progress(user_id, anime_id)


async def upsert_progress(user_id: object, input_data: dict) -> dict:
    anime_id = _require_anime_id(input_data)
    episode_number = int(input_data.get("episode_number") or 0)
    if episode_number <= 0:
        raise ValueError("episode_number must be a positive integer")
    watched = bool(input_data.get("watched"))
    watched_at = _now() if watched else None

    await _store().upsert_progress(
        user_id, anime_id, episode_number, watched, watched_at
    )
    return {
        "anime_id": anime_id,
        "episode_number": episode_number,
        "watched": watched,
        "watched_at": watched_at,
    }


# ── Settings ──────────────────────────────────────────────────────────────────


async def get_app_settings(user_id: object) -> dict:
    stored = await _store().get_value(user_id, _SETTINGS_KEY)
    if isinstance(stored, dict):
        return {**DEFAULT_SETTINGS, **stored}
    return dict(DEFAULT_SETTINGS)


async def merge_settings(user_id: object, input_data: dict) -> dict:
    merged = {
        "default_player": input_data.get("default_player") if input_data.get("default_player") in ["auto", "kodik"] else "auto",
        "default_quality": input_data.get("default_quality") if input_data.get("default_quality") in ["auto", "360p", "480p", "720p", "1080p"] else "auto",
        "default_dubbing": input_data.get("default_dubbing") if isinstance(input_data.get("default_dubbing"), str) and input_data.get("default_dubbing") else "auto",
        "theme": "dark",
        "notifications_enabled": input_data.get("notifications_enabled") if isinstance(input_data.get("notifications_enabled"), bool) else True,
        "cache_size_limit": _cache_limit(input_data.get("cache_size_limit")),
    }
    await _store().set_value(user_id, _SETTINGS_KEY, merged)
    return merged


# ── Notifications ─────────────────────────────────────────────────────────────


async def get_notifications(user_id: object, unread_only: bool) -> list[dict]:
    return await _store().list_notifications(user_id, unread_only)


async def mark_notification_read(user_id: object, notification_id: str) -> dict:
    await _store().mark_notification_read(user_id, notification_id)
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
