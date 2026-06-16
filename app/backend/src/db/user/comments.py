"""Per-anime comments + votes (likes/dislikes) + replies (parent_id)."""

from datetime import UTC, datetime

from src.db.anime_catalog import connect

_SCHEMA = """
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anime_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""

_VOTES_SCHEMA = """
CREATE TABLE IF NOT EXISTS comment_votes (
    comment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    PRIMARY KEY (comment_id, user_id)
);
"""

_INDEX = "CREATE INDEX IF NOT EXISTS idx_comments_anime ON comments(anime_id)"


def ensure_comments_schema(database_path: str) -> None:
    conn = connect(database_path)
    conn.execute(_SCHEMA)
    conn.execute(_VOTES_SCHEMA)
    conn.execute(_INDEX)
    # Older installs: add parent_id to the existing table
    try:
        conn.execute("ALTER TABLE comments ADD COLUMN parent_id INTEGER")
    except Exception:
        pass  # column already exists
    conn.commit()


def add_comment(
    database_path: str,
    anime_id: int,
    user_id: int,
    text: str,
    parent_id: int | None = None,
) -> int:
    conn = connect(database_path)
    cursor = conn.execute(
        "INSERT INTO comments (anime_id, user_id, parent_id, text, created_at) VALUES (?, ?, ?, ?, ?)",
        (anime_id, user_id, parent_id, text, datetime.now(tz=UTC).isoformat()),
    )
    conn.commit()
    return int(cursor.lastrowid or 0)


def list_comments(
    database_path: str, anime_id: int, viewer_id: int | None = None
) -> list[dict]:
    """Newest first, with author profile, vote totals and the viewer's vote."""
    rows = connect(database_path).execute(
        """
        SELECT c.id, c.anime_id, c.user_id, c.parent_id, c.text, c.created_at,
               u.name AS username, u.avatar_url,
               COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) AS likes,
               COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) AS dislikes,
               COALESCE(MAX(CASE WHEN v.user_id = ? THEN v.value END), 0) AS my_vote
        FROM comments c
        JOIN users u ON u.id = c.user_id
        LEFT JOIN comment_votes v ON v.comment_id = c.id
        WHERE c.anime_id = ?
        GROUP BY c.id
        ORDER BY c.id DESC
        """,
        (viewer_id, anime_id),
    ).fetchall()
    return [dict(row) for row in rows]


def get_comment(database_path: str, comment_id: int) -> dict | None:
    row = connect(database_path).execute(
        "SELECT id, anime_id, user_id, parent_id, text, created_at FROM comments WHERE id = ?",
        (comment_id,),
    ).fetchone()
    return dict(row) if row else None


def update_comment(database_path: str, comment_id: int, text: str) -> None:
    conn = connect(database_path)
    conn.execute("UPDATE comments SET text = ? WHERE id = ?", (text, comment_id))
    conn.commit()


def delete_comment(database_path: str, comment_id: int) -> None:
    """Delete a comment and its WHOLE reply subtree (any depth) + their votes."""
    conn = connect(database_path)
    subtree = """
        WITH RECURSIVE sub(id) AS (
            SELECT ?
            UNION ALL
            SELECT c.id FROM comments c JOIN sub ON c.parent_id = sub.id
        )
    """
    conn.execute(
        f"{subtree} DELETE FROM comment_votes "
        "WHERE comment_id IN (SELECT id FROM sub)",
        (comment_id,),
    )
    conn.execute(
        f"{subtree} DELETE FROM comments WHERE id IN (SELECT id FROM sub)",
        (comment_id,),
    )
    conn.commit()


def set_vote(
    database_path: str, comment_id: int, user_id: int, value: int
) -> None:
    """value: 1 like, -1 dislike, 0 removes the vote."""
    conn = connect(database_path)
    if value == 0:
        conn.execute(
            "DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?",
            (comment_id, user_id),
        )
    else:
        conn.execute(
            """
            INSERT INTO comment_votes (comment_id, user_id, value) VALUES (?, ?, ?)
            ON CONFLICT(comment_id, user_id) DO UPDATE SET value = excluded.value
            """,
            (comment_id, user_id, value),
        )
    conn.commit()


def get_vote_totals(database_path: str, comment_id: int) -> dict:
    row = connect(database_path).execute(
        """
        SELECT
            COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0) AS likes,
            COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0) AS dislikes
        FROM comment_votes WHERE comment_id = ?
        """,
        (comment_id,),
    ).fetchone()
    return dict(row) if row else {"likes": 0, "dislikes": 0}
