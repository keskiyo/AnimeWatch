import json
import sqlite3
from pathlib import Path


class LibraryStore:
    """SQLite persistence for user library data: watchlist, progress, settings, notifications."""

    def __init__(self, database_path: str) -> None:
        if database_path != ":memory:":
            Path(database_path).resolve().parent.mkdir(parents=True, exist_ok=True)

        self.connection = sqlite3.connect(database_path, check_same_thread=False)
        self.connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS watchlist (
                anime_id INTEGER PRIMARY KEY,
                added_at TEXT NOT NULL,
                status TEXT NOT NULL,
                favorite INTEGER NOT NULL DEFAULT 0,
                notifications_enabled INTEGER NOT NULL DEFAULT 1,
                last_watched_episode INTEGER
            );
            CREATE TABLE IF NOT EXISTS progress (
                anime_id INTEGER NOT NULL,
                episode_number INTEGER NOT NULL,
                watched INTEGER NOT NULL DEFAULT 0,
                watched_at TEXT,
                PRIMARY KEY (anime_id, episode_number)
            );
            CREATE TABLE IF NOT EXISTS app_kv (
                key TEXT PRIMARY KEY,
                value_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                anime_id INTEGER NOT NULL,
                episode_number INTEGER,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL,
                read INTEGER NOT NULL DEFAULT 0,
                type TEXT NOT NULL
            );
            """
        )
        self.connection.commit()

    # ── Watchlist ─────────────────────────────────────────────────────────────

    def list_watchlist(self) -> list[dict]:
        rows = self.connection.execute(
            """
            SELECT anime_id, added_at, status, favorite, notifications_enabled, last_watched_episode
            FROM watchlist ORDER BY added_at DESC
            """
        ).fetchall()
        return [self._watchlist_row(row) for row in rows]

    def get_watchlist_item(self, anime_id: int) -> dict | None:
        row = self.connection.execute(
            """
            SELECT anime_id, added_at, status, favorite, notifications_enabled, last_watched_episode
            FROM watchlist WHERE anime_id = ?
            """,
            (anime_id,),
        ).fetchone()
        return self._watchlist_row(row) if row else None

    def upsert_watchlist_item(
        self,
        anime_id: int,
        added_at: str,
        status: str,
        favorite: bool,
        notifications_enabled: bool,
        last_watched_episode: int | None,
    ) -> None:
        self.connection.execute(
            """
            INSERT INTO watchlist (anime_id, added_at, status, favorite, notifications_enabled, last_watched_episode)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(anime_id) DO UPDATE SET
                status = excluded.status,
                favorite = excluded.favorite,
                notifications_enabled = excluded.notifications_enabled,
                last_watched_episode = excluded.last_watched_episode
            """,
            (anime_id, added_at, status, int(favorite), int(notifications_enabled), last_watched_episode),
        )
        self.connection.commit()

    def delete_watchlist_item(self, anime_id: int) -> None:
        self.connection.execute("DELETE FROM watchlist WHERE anime_id = ?", (anime_id,))
        self.connection.commit()

    def set_last_watched_episode(self, anime_id: int, episode_number: int) -> None:
        self.connection.execute(
            """
            UPDATE watchlist
            SET last_watched_episode = MAX(COALESCE(last_watched_episode, 0), ?)
            WHERE anime_id = ?
            """,
            (episode_number, anime_id),
        )
        self.connection.commit()

    # ── Progress ──────────────────────────────────────────────────────────────

    def list_progress(self, anime_id: int) -> list[dict]:
        rows = self.connection.execute(
            """
            SELECT anime_id, episode_number, watched, watched_at
            FROM progress WHERE anime_id = ? ORDER BY episode_number
            """,
            (anime_id,),
        ).fetchall()
        return [
            {
                "anime_id": row[0],
                "episode_number": row[1],
                "watched": bool(row[2]),
                "watched_at": row[3],
            }
            for row in rows
        ]

    def upsert_progress(
        self, anime_id: int, episode_number: int, watched: bool, watched_at: str | None
    ) -> None:
        self.connection.execute(
            """
            INSERT INTO progress (anime_id, episode_number, watched, watched_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(anime_id, episode_number) DO UPDATE SET
                watched = excluded.watched,
                watched_at = excluded.watched_at
            """,
            (anime_id, episode_number, int(watched), watched_at),
        )
        self.connection.commit()

    # ── Key-value (settings) ──────────────────────────────────────────────────

    def get_value(self, key: str) -> object | None:
        row = self.connection.execute(
            "SELECT value_json FROM app_kv WHERE key = ?", (key,)
        ).fetchone()
        if row is None:
            return None
        try:
            return json.loads(row[0])
        except json.JSONDecodeError:
            return None

    def set_value(self, key: str, value: object) -> None:
        self.connection.execute(
            """
            INSERT INTO app_kv (key, value_json) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json
            """,
            (key, json.dumps(value)),
        )
        self.connection.commit()

    # ── Notifications ─────────────────────────────────────────────────────────

    def list_notifications(self, unread_only: bool) -> list[dict]:
        sql = """
            SELECT id, anime_id, episode_number, title, message, created_at, read, type
            FROM notifications
        """
        if unread_only:
            sql += " WHERE read = 0"
        sql += " ORDER BY created_at DESC"
        rows = self.connection.execute(sql).fetchall()
        return [
            {
                "id": row[0],
                "anime_id": row[1],
                "episode_number": row[2],
                "title": row[3],
                "message": row[4],
                "created_at": row[5],
                "read": bool(row[6]),
                "type": row[7],
            }
            for row in rows
        ]

    def mark_notification_read(self, notification_id: str) -> None:
        self.connection.execute(
            "UPDATE notifications SET read = 1 WHERE id = ?", (notification_id,)
        )
        self.connection.commit()

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _watchlist_row(row: tuple) -> dict:
        return {
            "anime_id": row[0],
            "added_at": row[1],
            "status": row[2],
            "favorite": bool(row[3]),
            "notifications_enabled": bool(row[4]),
            "last_watched_episode": row[5],
        }
