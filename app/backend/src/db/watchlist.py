"""Per-user anime category lists."""

from src.db.anime_catalog import connect

VALID_WATCHLIST_STATUSES = {
    "watching",
    "plan_to_watch",
    "completed",
    "on_hold",
    "dropped",
}

_SCHEMA = """
CREATE TABLE IF NOT EXISTS watchlist_categories (
    user_id INTEGER NOT NULL,
    anime_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    added_at TEXT NOT NULL,
    PRIMARY KEY (user_id, anime_id, status)
);
CREATE INDEX IF NOT EXISTS idx_watchlist_categories_user
ON watchlist_categories (user_id, added_at DESC);
"""


def ensure_watchlist_schema(database_path: str) -> None:
    conn = connect(database_path)
    conn.executescript(_SCHEMA)
    conn.commit()


def list_user_watchlist(database_path: str, user_id: int) -> list[dict]:
    ensure_watchlist_schema(database_path)
    rows = connect(database_path).execute(
        """
        SELECT user_id, anime_id, status, added_at
        FROM watchlist_categories
        WHERE user_id = ?
        ORDER BY added_at DESC
        """,
        (user_id,),
    ).fetchall()
    return [_row(row) for row in rows]


def list_user_anime_statuses(
    database_path: str,
    user_id: int,
    anime_id: int,
) -> list[str]:
    ensure_watchlist_schema(database_path)
    rows = connect(database_path).execute(
        """
        SELECT status FROM watchlist_categories
        WHERE user_id = ? AND anime_id = ?
        ORDER BY added_at DESC
        """,
        (user_id, anime_id),
    ).fetchall()
    return [row["status"] for row in rows]


def toggle_watchlist_status(
    database_path: str,
    user_id: int,
    anime_id: int,
    status: str,
    added_at: str,
) -> bool:
    ensure_watchlist_schema(database_path)
    conn = connect(database_path)
    existing = conn.execute(
        """
        SELECT 1 FROM watchlist_categories
        WHERE user_id = ? AND anime_id = ? AND status = ?
        """,
        (user_id, anime_id, status),
    ).fetchone()
    if existing:
        conn.execute(
            """
            DELETE FROM watchlist_categories
            WHERE user_id = ? AND anime_id = ? AND status = ?
            """,
            (user_id, anime_id, status),
        )
        conn.commit()
        return False

    conn.execute(
        """
        INSERT INTO watchlist_categories (user_id, anime_id, status, added_at)
        VALUES (?, ?, ?, ?)
        """,
        (user_id, anime_id, status, added_at),
    )
    conn.commit()
    return True


def delete_watchlist_anime(
    database_path: str,
    user_id: int,
    anime_id: int,
) -> None:
    ensure_watchlist_schema(database_path)
    conn = connect(database_path)
    conn.execute(
        "DELETE FROM watchlist_categories WHERE user_id = ? AND anime_id = ?",
        (user_id, anime_id),
    )
    conn.commit()


def _row(row) -> dict:
    return {
        "user_id": row["user_id"],
        "anime_id": row["anime_id"],
        "status": row["status"],
        "added_at": row["added_at"],
    }
