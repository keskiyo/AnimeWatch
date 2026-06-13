from datetime import UTC, datetime
from pathlib import Path

from src.db.anime_catalog import connect

ALLOWED_STATIC_PAGE_SLUGS = {"agreement", "privacy", "copyright"}

_SCHEMA = """
CREATE TABLE IF NOT EXISTS static_pages (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by INTEGER
);
"""

_CONTENT_DIR = Path(__file__).with_name("static_page_content")


def ensure_static_pages_schema(database_path: str) -> None:
    conn = connect(database_path)
    conn.execute(_SCHEMA)
    now = datetime.now(tz=UTC).isoformat()
    for slug, (title, content) in _load_defaults().items():
        conn.execute(
            """
            INSERT OR IGNORE INTO static_pages
            (slug, title, content, updated_at, updated_by)
            VALUES (?, ?, ?, ?, NULL)
            """,
            (slug, title, content, now),
        )
        conn.execute(
            """
            UPDATE static_pages
            SET title = ?, content = ?, updated_at = ?
            WHERE slug = ? AND updated_by IS NULL
            """,
            (title, content, now, slug),
        )
    conn.commit()


def _load_defaults() -> dict[str, tuple[str, str]]:
    defaults: dict[str, tuple[str, str]] = {}
    for slug in ALLOWED_STATIC_PAGE_SLUGS:
        title = (_CONTENT_DIR / f"{slug}.title.txt").read_text(encoding="utf-8").strip()
        content = (_CONTENT_DIR / f"{slug}.txt").read_text(encoding="utf-8").strip()
        defaults[slug] = (title, content)
    return defaults


def list_static_pages(database_path: str) -> list[dict]:
    ensure_static_pages_schema(database_path)
    rows = connect(database_path).execute(
        """
        SELECT slug, title, content, updated_at, updated_by
        FROM static_pages ORDER BY slug
        """
    ).fetchall()
    return [dict(row) for row in rows]


def get_static_page(database_path: str, slug: str) -> dict | None:
    ensure_static_pages_schema(database_path)
    row = connect(database_path).execute(
        """
        SELECT slug, title, content, updated_at, updated_by
        FROM static_pages WHERE slug = ?
        """,
        (slug,),
    ).fetchone()
    return dict(row) if row else None


def update_static_page(
    database_path: str,
    slug: str,
    title: str,
    content: str,
    admin_id: int,
) -> dict | None:
    ensure_static_pages_schema(database_path)
    conn = connect(database_path)
    conn.execute(
        """
        UPDATE static_pages
        SET title = ?, content = ?, updated_at = ?, updated_by = ?
        WHERE slug = ?
        """,
        (title, content, datetime.now(tz=UTC).isoformat(), admin_id, slug),
    )
    conn.commit()
    return get_static_page(database_path, slug)
