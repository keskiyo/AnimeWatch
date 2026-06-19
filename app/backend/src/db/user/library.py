"""Library data (Mongo). GLOBAL (not per-user yet — known debt).

Collections: `library_watchlist` (_id=anime_id), `progress`
(unique anime_id+episode_number), `app_kv` (_id=key), `notifications` (_id=id).
"""

from src.db.mongo import get_db


class LibraryStore:
    """Mongo persistence for the (global) library: watchlist, progress, settings, notifications."""

    @property
    def _db(self):
        return get_db()

    # ── Watchlist ─────────────────────────────────────────────────────────────

    async def list_watchlist(self) -> list[dict]:
        cursor = self._db.library_watchlist.find({}).sort("added_at", -1)
        return [self._watchlist_row(doc) async for doc in cursor]

    async def get_watchlist_item(self, anime_id: int) -> dict | None:
        doc = await self._db.library_watchlist.find_one({"_id": int(anime_id)})
        return self._watchlist_row(doc) if doc else None

    async def upsert_watchlist_item(
        self,
        anime_id: int,
        added_at: str,
        status: str,
        favorite: bool,
        notifications_enabled: bool,
        last_watched_episode: int | None,
    ) -> None:
        await self._db.library_watchlist.update_one(
            {"_id": int(anime_id)},
            {
                "$set": {
                    "added_at": added_at,
                    "status": status,
                    "favorite": bool(favorite),
                    "notifications_enabled": bool(notifications_enabled),
                    "last_watched_episode": last_watched_episode,
                }
            },
            upsert=True,
        )

    async def delete_watchlist_item(self, anime_id: int) -> None:
        await self._db.library_watchlist.delete_one({"_id": int(anime_id)})

    async def set_last_watched_episode(self, anime_id: int, episode_number: int) -> None:
        doc = await self._db.library_watchlist.find_one({"_id": int(anime_id)})
        current = (doc or {}).get("last_watched_episode") or 0
        await self._db.library_watchlist.update_one(
            {"_id": int(anime_id)},
            {"$set": {"last_watched_episode": max(current, int(episode_number))}},
        )

    # ── Progress ──────────────────────────────────────────────────────────────

    async def list_progress(self, anime_id: int) -> list[dict]:
        cursor = self._db.progress.find({"anime_id": int(anime_id)}).sort(
            "episode_number", 1
        )
        return [
            {
                "anime_id": doc["anime_id"],
                "episode_number": doc["episode_number"],
                "watched": bool(doc.get("watched")),
                "watched_at": doc.get("watched_at"),
            }
            async for doc in cursor
        ]

    async def upsert_progress(
        self, anime_id: int, episode_number: int, watched: bool, watched_at: str | None
    ) -> None:
        await self._db.progress.update_one(
            {"anime_id": int(anime_id), "episode_number": int(episode_number)},
            {"$set": {"watched": bool(watched), "watched_at": watched_at}},
            upsert=True,
        )

    # ── Key-value (settings) ──────────────────────────────────────────────────

    async def get_value(self, key: str) -> object | None:
        doc = await self._db.app_kv.find_one({"_id": key})
        return doc.get("value") if doc else None

    async def set_value(self, key: str, value: object) -> None:
        await self._db.app_kv.update_one(
            {"_id": key}, {"$set": {"value": value}}, upsert=True
        )

    # ── Notifications ─────────────────────────────────────────────────────────

    async def list_notifications(self, unread_only: bool) -> list[dict]:
        query = {"read": 0} if unread_only else {}
        cursor = self._db.notifications.find(query).sort("created_at", -1)
        return [
            {
                "id": doc["_id"],
                "anime_id": doc.get("anime_id"),
                "episode_number": doc.get("episode_number"),
                "title": doc.get("title", ""),
                "message": doc.get("message", ""),
                "created_at": doc.get("created_at", ""),
                "read": bool(doc.get("read")),
                "type": doc.get("type", ""),
            }
            async for doc in cursor
        ]

    async def mark_notification_read(self, notification_id: str) -> None:
        await self._db.notifications.update_one(
            {"_id": notification_id}, {"$set": {"read": 1}}
        )

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _watchlist_row(doc: dict) -> dict:
        return {
            "anime_id": doc["_id"],
            "added_at": doc.get("added_at", ""),
            "status": doc.get("status", ""),
            "favorite": bool(doc.get("favorite")),
            "notifications_enabled": bool(doc.get("notifications_enabled")),
            "last_watched_episode": doc.get("last_watched_episode"),
        }
