import json
from datetime import UTC, datetime
from typing import Any

from src.db.anime_catalog import connect

_SCHEMA = """
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);
"""


def ensure_admin_audit_schema(database_path: str) -> None:
    conn = connect(database_path)
    conn.execute(_SCHEMA)
    conn.commit()


def add_admin_audit_log(
    database_path: str,
    admin_user_id: int,
    action: str,
    target_type: str,
    target_id: str,
    metadata: dict[str, Any] | None = None,
) -> None:
    ensure_admin_audit_schema(database_path)
    connect(database_path).execute(
        """
        INSERT INTO admin_audit_log (
            admin_user_id, action, target_type, target_id,
            metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            admin_user_id,
            action,
            target_type,
            target_id,
            json.dumps(metadata or {}, ensure_ascii=False),
            datetime.now(tz=UTC).isoformat(),
        ),
    )
    connect(database_path).commit()


def list_admin_audit_logs(
    database_path: str,
    page: int = 1,
    limit: int = 30,
) -> dict[str, Any]:
    ensure_admin_audit_schema(database_path)
    safe_page = max(1, page)
    safe_limit = max(1, min(limit, 100))
    offset = (safe_page - 1) * safe_limit
    total = connect(database_path).execute(
        "SELECT COUNT(*) FROM admin_audit_log"
    ).fetchone()
    rows = connect(database_path).execute(
        """
        SELECT
            log.id,
            log.admin_user_id,
            users.name AS admin_name,
            log.action,
            log.target_type,
            log.target_id,
            log.metadata_json,
            log.created_at
        FROM admin_audit_log AS log
        LEFT JOIN users ON users.id = log.admin_user_id
        ORDER BY log.id DESC
        LIMIT ? OFFSET ?
        """,
        (safe_limit, offset),
    ).fetchall()
    return {
        "data": [dict(row) for row in rows],
        "total": int(total[0]) if total else 0,
        "page": safe_page,
    }
