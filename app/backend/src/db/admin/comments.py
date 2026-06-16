"""Admin moderation queries over comments (list with author + anime title)."""

from typing import Any

from src.db.anime_catalog import connect


def list_admin_comments(
    database_path: str,
    page: int = 1,
    limit: int = 30,
) -> dict[str, Any]:
    """Newest-first comments with author and anime title, paginated."""
    safe_page = max(page, 1)
    safe_limit = min(max(limit, 1), 100)
    offset = (safe_page - 1) * safe_limit
    conn = connect(database_path)

    total = conn.execute("SELECT COUNT(*) FROM comments").fetchone()
    rows = conn.execute(
        """
        SELECT
            c.id, c.anime_id, c.user_id, c.parent_id, c.text, c.created_at,
            u.name AS username, u.avatar_url AS user_avatar,
            COALESCE(NULLIF(a.title_ru, ''), a.title_en, '') AS anime_title
        FROM comments c
        JOIN users u ON u.id = c.user_id
        LEFT JOIN anime_catalog a ON a.id = c.anime_id
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?
        """,
        (safe_limit, offset),
    ).fetchall()

    return {
        "data": [dict(row) for row in rows],
        "total": int(total[0]) if total else 0,
        "page": safe_page,
    }
