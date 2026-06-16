from datetime import UTC, datetime
from sqlite3 import OperationalError
from typing import Any

from src.db.anime_catalog import connect


def ensure_admin_user_schema(database_path: str) -> None:
    conn = connect(database_path)
    for sql in (
        "ALTER TABLE users ADD COLUMN is_blocked INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE users ADD COLUMN blocked_at TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE users ADD COLUMN last_seen_at TEXT NOT NULL DEFAULT ''",
    ):
        try:
            conn.execute(sql)
        except OperationalError as exc:
            if "duplicate column" not in str(exc).lower():
                raise
    conn.commit()


def list_admin_users(
    database_path: str,
    search: str = "",
    role: str = "",
    blocked: str = "",
    page: int = 1,
    limit: int = 30,
) -> dict[str, Any]:
    ensure_admin_user_schema(database_path)
    safe_page = max(page, 1)
    safe_limit = min(max(limit, 1), 100)
    offset = (safe_page - 1) * safe_limit
    where_sql, args = _build_filters(search, role, blocked)
    conn = connect(database_path)

    total_row = conn.execute(f"SELECT COUNT(*) FROM users{where_sql}", args).fetchone()
    rows = conn.execute(
        f"""
        SELECT id, name, email, avatar_url, role, created_at,
               is_blocked, blocked_at, last_seen_at
        FROM users{where_sql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        """,
        [*args, safe_limit, offset],
    ).fetchall()

    return {
        "data": [dict(row) for row in rows],
        "total": int(total_row[0]) if total_row else 0,
        "page": safe_page,
    }


def set_admin_user_role(database_path: str, user_id: int, role: str) -> dict | None:
    ensure_admin_user_schema(database_path)
    conn = connect(database_path)
    conn.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
    conn.commit()
    return _get_admin_user(database_path, user_id)


def set_admin_user_blocked(
    database_path: str,
    user_id: int,
    is_blocked: bool,
) -> dict | None:
    ensure_admin_user_schema(database_path)
    blocked_at = datetime.now(tz=UTC).isoformat() if is_blocked else ""
    conn = connect(database_path)
    conn.execute(
        "UPDATE users SET is_blocked = ?, blocked_at = ? WHERE id = ?",
        (int(is_blocked), blocked_at, user_id),
    )
    conn.commit()
    return _get_admin_user(database_path, user_id)


def is_user_blocked(database_path: str, user_id: int) -> bool:
    ensure_admin_user_schema(database_path)
    row = connect(database_path).execute(
        "SELECT is_blocked FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    return bool(row and row["is_blocked"])


def touch_user_last_seen(database_path: str, user_id: int) -> None:
    ensure_admin_user_schema(database_path)
    connect(database_path).execute(
        "UPDATE users SET last_seen_at = ? WHERE id = ?",
        (datetime.now(tz=UTC).isoformat(), user_id),
    )
    connect(database_path).commit()


def _get_admin_user(database_path: str, user_id: int) -> dict | None:
    row = connect(database_path).execute(
        """
        SELECT id, name, email, avatar_url, role, created_at,
               is_blocked, blocked_at, last_seen_at
        FROM users WHERE id = ?
        """,
        (user_id,),
    ).fetchone()
    return dict(row) if row else None


def _build_filters(search: str, role: str, blocked: str) -> tuple[str, list[Any]]:
    clauses: list[str] = []
    args: list[Any] = []
    query = search.strip().lower()
    if query:
        like = f"%{query}%"
        clauses.append(
            "(CAST(id AS TEXT) = ? OR LOWER(name) LIKE ? OR LOWER(email) LIKE ?)"
        )
        args.extend([query, like, like])
    if role in {"user", "admin"}:
        clauses.append("role = ?")
        args.append(role)
    if blocked in {"0", "1"}:
        clauses.append("is_blocked = ?")
        args.append(int(blocked))
    return (f" WHERE {' AND '.join(clauses)}" if clauses else "", args)
