"""Key-value sync state storage (which sync ran when, status, errors)."""

from datetime import UTC, datetime

from src.db.anime_catalog import connect

_SYNC_STATE_SCHEMA = """
CREATE TABLE IF NOT EXISTS sync_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""


def ensure_sync_state_schema(database_path: str) -> None:
    conn = connect(database_path)
    conn.execute(_SYNC_STATE_SCHEMA)
    conn.commit()


def get_sync_state(database_path: str, key: str) -> str | None:
    ensure_sync_state_schema(database_path)
    row = connect(database_path).execute(
        "SELECT value FROM sync_state WHERE key = ?", (key,)
    ).fetchone()
    return row[0] if row else None


def set_sync_state(database_path: str, key: str, value: str) -> None:
    ensure_sync_state_schema(database_path)
    conn = connect(database_path)
    conn.execute(
        """
        INSERT INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
        """,
        (key, value, datetime.now(tz=UTC).isoformat()),
    )
    conn.commit()


def get_all_sync_state(database_path: str) -> dict[str, str]:
    ensure_sync_state_schema(database_path)
    rows = connect(database_path).execute(
        "SELECT key, value FROM sync_state"
    ).fetchall()
    return {row[0]: row[1] for row in rows}
