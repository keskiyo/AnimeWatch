from typing import Any

from src.db.anime_catalog import connect


def list_admin_users(
    database_path: str,
    search: str = "",
    page: int = 1,
    limit: int = 30,
) -> dict[str, Any]:
    safe_page = max(page, 1)
    safe_limit = min(max(limit, 1), 100)
    offset = (safe_page - 1) * safe_limit
    where_sql, args = _build_search(search)
    conn = connect(database_path)

    total_row = conn.execute(f"SELECT COUNT(*) FROM users{where_sql}", args).fetchone()
    rows = conn.execute(
        f"""
        SELECT id, name, email, avatar_url, role, created_at
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


def _build_search(search: str) -> tuple[str, list[Any]]:
    query = search.strip().lower()
    if not query:
        return "", []
    like = f"%{query}%"
    return (
        " WHERE CAST(id AS TEXT) = ? OR LOWER(name) LIKE ? OR LOWER(email) LIKE ?",
        [query, like, like],
    )
