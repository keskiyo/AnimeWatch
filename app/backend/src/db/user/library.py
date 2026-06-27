"""Per-user library data (Mongo): watch progress, settings, notifications.

All rows are scoped by `user_id` (ObjectId) — a user only ever sees their own
progress/settings/notifications. Collections: `progress`
(unique user_id+anime_id+episode_number), `user_settings` (unique user_id+key),
`notifications` (own _id + user_id).
"""

from src.db.mongo import get_db, to_oid


class LibraryStore:
    """Mongo persistence for one user's progress, settings and notifications."""

    @property
    def _db(self):
        return get_db()

    # ── Progress ──────────────────────────────────────────────────────────────

    async def list_progress(self, user_id: object, anime_id: int) -> list[dict]:
        cursor = self._db.progress.find(
            {"user_id": to_oid(user_id), "anime_id": int(anime_id)}
        ).sort("episode_number", 1)
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
        self,
        user_id: object,
        anime_id: int,
        episode_number: int,
        watched: bool,
        watched_at: str | None,
    ) -> None:
        await self._db.progress.update_one(
            {
                "user_id": to_oid(user_id),
                "anime_id": int(anime_id),
                "episode_number": int(episode_number),
            },
            {"$set": {"watched": bool(watched), "watched_at": watched_at}},
            upsert=True,
        )

    # ── Key-value (settings) ──────────────────────────────────────────────────

    async def get_value(self, user_id: object, key: str) -> object | None:
        doc = await self._db.user_settings.find_one(
            {"user_id": to_oid(user_id), "key": key}
        )
        return doc.get("value") if doc else None

    async def set_value(self, user_id: object, key: str, value: object) -> None:
        await self._db.user_settings.update_one(
            {"user_id": to_oid(user_id), "key": key},
            {"$set": {"value": value}},
            upsert=True,
        )

    # ── Notifications ─────────────────────────────────────────────────────────

    async def list_notifications(
        self, user_id: object, unread_only: bool
    ) -> list[dict]:
        query: dict = {"user_id": to_oid(user_id)}
        if unread_only:
            query["read"] = 0
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

    async def mark_notification_read(
        self, user_id: object, notification_id: str
    ) -> None:
        await self._db.notifications.update_one(
            {"_id": notification_id, "user_id": to_oid(user_id)},
            {"$set": {"read": 1}},
        )
