from datetime import UTC, datetime

from src.services.mock_data import MOCK_ANIME


watchlist = [
    {
        "anime_id": 52991,
        "added_at": "2026-05-12T10:00:00Z",
        "status": "watching",
        "favorite": True,
        "notifications_enabled": True,
        "last_watched_episode": 12,
        "anime": MOCK_ANIME[0],
    }
]
progress = [{"anime_id": 52991, "episode_number": 12, "watched": True, "watched_at": "2026-06-01T19:00:00Z"}]
notifications = [
    {
        "id": "episode-release-1",
        "anime_id": 56321,
        "episode_number": 5,
        "title": "Zhong Kui episode 5",
        "message": "New tracked episode is expected today.",
        "created_at": "2026-06-07T06:00:00Z",
        "read": False,
        "type": "episode_release",
    }
]
settings = {
    "default_player": "auto",
    "default_quality": "auto",
    "default_dubbing": "auto",
    "theme": "dark",
    "notifications_enabled": True,
    "cache_size_limit": 512,
}


def get_watchlist() -> list[dict]:
    return watchlist


def upsert_watchlist_item(input_data: dict) -> dict:
    existing = next((item for item in watchlist if item["anime_id"] == input_data["anime_id"]), None)
    next_item = {
        "anime_id": input_data["anime_id"],
        "added_at": existing["added_at"] if existing else _now(),
        "status": input_data["status"],
        "favorite": input_data["favorite"],
        "notifications_enabled": existing["notifications_enabled"] if existing else True,
        "last_watched_episode": existing.get("last_watched_episode") if existing else None,
        "anime": next((anime for anime in MOCK_ANIME if anime["id"] == input_data["anime_id"]), None),
    }
    if existing:
        watchlist[watchlist.index(existing)] = next_item
    else:
        watchlist.append(next_item)
    return next_item


def delete_watchlist_item(anime_id: int) -> dict:
    watchlist[:] = [item for item in watchlist if item["anime_id"] != anime_id]
    return {"success": True}


def get_progress(anime_id: int) -> list[dict]:
    return [item for item in progress if item["anime_id"] == anime_id]


def upsert_progress(input_data: dict) -> dict:
    next_item = {**input_data, "watched_at": _now() if input_data["watched"] else None}
    progress[:] = [
        item
        for item in progress
        if not (item["anime_id"] == input_data["anime_id"] and item["episode_number"] == input_data["episode_number"])
    ]
    progress.append(next_item)
    return next_item


def merge_settings(input_data: dict) -> dict:
    settings.update(
        {
            "default_player": input_data.get("default_player") if input_data.get("default_player") in ["auto", "kodik", "aniboom"] else "auto",
            "default_quality": input_data.get("default_quality") if input_data.get("default_quality") in ["auto", "360p", "480p", "720p", "1080p"] else "auto",
            "default_dubbing": input_data.get("default_dubbing") if input_data.get("default_dubbing") in ["auto", "AniLibria", "SovetRomantica", "AnimeVost"] else "auto",
            "theme": "dark",
            "notifications_enabled": input_data.get("notifications_enabled") if isinstance(input_data.get("notifications_enabled"), bool) else True,
            "cache_size_limit": _cache_limit(input_data.get("cache_size_limit")),
        }
    )
    return settings


def get_notifications(unread_only: bool) -> list[dict]:
    return [item for item in notifications if not item["read"]] if unread_only else notifications


def mark_notification_read(notification_id: str) -> dict:
    for item in notifications:
        if item["id"] == notification_id:
            item["read"] = True
    return {"success": True}


def _cache_limit(value: object) -> int:
    return min(max(round(value), 64), 4096) if isinstance(value, int | float) else 512


def _now() -> str:
    return datetime.now(tz=UTC).isoformat().replace("+00:00", "Z")
