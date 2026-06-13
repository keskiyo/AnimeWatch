"""Persistent anime catalog storage (SQLite): schema, connection, upserts.

Unlike CacheStore (TTL cache), this is a permanent table: rows survive
backend restarts and are only ever upserted, never deleted by sync.

Read queries live in src/db/anime_catalog_queries.py,
sync bookkeeping in src/db/sync_state.py.
"""

import json
import sqlite3
import threading
from datetime import UTC, datetime
from pathlib import Path

from src.logger import get_logger
from src.models import Anime

log = get_logger(__name__)

_connections: dict[tuple[str, int], sqlite3.Connection] = {}

_SCHEMA = """
CREATE TABLE IF NOT EXISTS anime_catalog (
    id INTEGER PRIMARY KEY,
    title_ru TEXT NOT NULL DEFAULT '',
    title_en TEXT NOT NULL DEFAULT '',
    title_jp TEXT NOT NULL DEFAULT '',
    poster_url TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    genres_json TEXT NOT NULL DEFAULT '[]',
    studio TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT '',
    season TEXT NOT NULL DEFAULT '',
    year INTEGER NOT NULL DEFAULT 0,
    episodes_total INTEGER NOT NULL DEFAULT 0,
    episodes_aired INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 0,
    score_count INTEGER NOT NULL DEFAULT 0,
    url_shikimori TEXT NOT NULL DEFAULT '',
    next_episode_at TEXT,
    rating_mpaa TEXT,
    duration INTEGER,
    updated_at TEXT NOT NULL DEFAULT '',
    synced_at TEXT NOT NULL DEFAULT ''
);
"""

_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_anime_catalog_year ON anime_catalog(year)",
    "CREATE INDEX IF NOT EXISTS idx_anime_catalog_status ON anime_catalog(status)",
    "CREATE INDEX IF NOT EXISTS idx_anime_catalog_type ON anime_catalog(type)",
    "CREATE INDEX IF NOT EXISTS idx_anime_catalog_rating ON anime_catalog(rating)",
    "CREATE INDEX IF NOT EXISTS idx_anime_catalog_title_ru ON anime_catalog(title_ru)",
    "CREATE INDEX IF NOT EXISTS idx_anime_catalog_title_en ON anime_catalog(title_en)",
]

_UPSERT_SQL = """
INSERT INTO anime_catalog (
    id, title_ru, title_en, title_jp, poster_url, description, genres_json,
    studio, type, status, season, year, episodes_total, episodes_aired,
    rating, score_count, url_shikimori, next_episode_at, rating_mpaa,
    duration, updated_at, synced_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
    title_ru = excluded.title_ru,
    title_en = excluded.title_en,
    title_jp = excluded.title_jp,
    poster_url = excluded.poster_url,
    description = CASE
        WHEN excluded.description != '' THEN excluded.description
        ELSE anime_catalog.description
    END,
    genres_json = excluded.genres_json,
    studio = excluded.studio,
    type = excluded.type,
    status = excluded.status,
    season = excluded.season,
    year = excluded.year,
    episodes_total = excluded.episodes_total,
    episodes_aired = excluded.episodes_aired,
    rating = excluded.rating,
    score_count = excluded.score_count,
    url_shikimori = excluded.url_shikimori,
    next_episode_at = excluded.next_episode_at,
    rating_mpaa = excluded.rating_mpaa,
    duration = excluded.duration,
    updated_at = excluded.updated_at,
    synced_at = excluded.synced_at
"""


def connect(database_path: str) -> sqlite3.Connection:
    """Shared connection per database path and thread (rows as sqlite3.Row)."""
    key = (database_path, threading.get_ident())
    if key not in _connections:
        if database_path != ":memory:":
            Path(database_path).resolve().parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(database_path, timeout=5)
        conn.execute("PRAGMA busy_timeout = 5000")
        conn.execute("PRAGMA foreign_keys = ON")
        if database_path != ":memory:":
            conn.execute("PRAGMA journal_mode = WAL")
        conn.row_factory = sqlite3.Row
        _connections[key] = conn
    return _connections[key]


# Detail-page fields persisted on first visit (lightweight migrations).
# has_kodik: NULL = unchecked, 1 = has Kodik dubbing, 0 = confirmed none.
_DETAIL_COLUMNS = [
    ("source", "TEXT NOT NULL DEFAULT ''"),
    ("screenshots_json", "TEXT NOT NULL DEFAULT '[]'"),
    ("directors_json", "TEXT NOT NULL DEFAULT '[]'"),
    ("authors_json", "TEXT NOT NULL DEFAULT '[]'"),
    ("characters_json", "TEXT NOT NULL DEFAULT '[]'"),
    ("detailed_at", "TEXT NOT NULL DEFAULT ''"),
    ("has_kodik", "INTEGER DEFAULT NULL"),
    ("has_kodik_checked_at", "TEXT NOT NULL DEFAULT ''"),
]


def ensure_anime_catalog_schema(database_path: str) -> None:
    conn = connect(database_path)
    conn.execute(_SCHEMA)
    for index_sql in _INDEXES:
        conn.execute(index_sql)
    for column, definition in _DETAIL_COLUMNS:
        try:
            conn.execute(f"ALTER TABLE anime_catalog ADD COLUMN {column} {definition}")
            log.info("[catalog] migrated: added column %s", column)
        except sqlite3.OperationalError as exc:
            if "duplicate column" not in str(exc).lower():
                raise  # unexpected migration failure — don't silence it
    # Index created after the migration above (column may not exist yet on fresh DB)
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_anime_catalog_has_kodik "
        "ON anime_catalog(has_kodik)"
    )
    conn.commit()


def upsert_anime_catalog_item(database_path: str, anime: Anime) -> None:
    upsert_anime_catalog_many(database_path, [anime])


def upsert_anime_catalog_many(database_path: str, items: list[Anime]) -> int:
    """Upsert items (never deletes). Returns the number of rows written."""
    if not items:
        return 0
    conn = connect(database_path)
    synced_at = datetime.now(tz=UTC).isoformat()
    rows = []
    for anime in items:
        try:
            rows.append(_anime_to_row(anime, synced_at))
        except (KeyError, TypeError, ValueError):
            continue
    conn.executemany(_UPSERT_SQL, rows)
    conn.commit()
    return len(rows)


def mark_kodik_availability(database_path: str, kodik_ids: set[int]) -> dict:
    """Set has_kodik for the WHOLE catalog from a complete Kodik id set.

    ids present in Kodik → has_kodik=1, everyone else → 0. Touches only the
    has_kodik columns (never other catalog fields), deletes no rows. Runs in a
    single transaction so the flag is always consistent. Caller must pass a
    COMPLETE set (a partial crawl would wrongly hide titles)."""
    ensure_anime_catalog_schema(database_path)
    conn = connect(database_path)
    now = datetime.now(tz=UTC).isoformat()
    try:
        conn.execute("CREATE TEMP TABLE IF NOT EXISTS _kodik_ids (id INTEGER PRIMARY KEY)")
        conn.execute("DELETE FROM _kodik_ids")
        conn.executemany(
            "INSERT OR IGNORE INTO _kodik_ids (id) VALUES (?)",
            [(int(i),) for i in kodik_ids],
        )
        conn.execute(
            """
            UPDATE anime_catalog SET
                has_kodik = CASE
                    WHEN id IN (SELECT id FROM _kodik_ids) THEN 1 ELSE 0
                END,
                has_kodik_checked_at = ?
            """,
            (now,),
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    with_kodik = conn.execute(
        "SELECT COUNT(*) FROM anime_catalog WHERE has_kodik = 1"
    ).fetchone()[0]
    without = conn.execute(
        "SELECT COUNT(*) FROM anime_catalog WHERE has_kodik = 0"
    ).fetchone()[0]
    return {"with": int(with_kodik), "without": int(without)}


# ── Row mapping ───────────────────────────────────────────────────────────────


def _anime_to_row(anime: Anime, synced_at: str) -> tuple:
    return (
        int(anime["id"]),
        anime.get("title_ru") or "",
        anime.get("title_en") or "",
        anime.get("title_jp") or "",
        anime.get("poster_url") or "",
        anime.get("description") or "",
        json.dumps(anime.get("genres") or [], ensure_ascii=False),
        anime.get("studio") or "",
        anime.get("type") or "",
        anime.get("status") or "",
        anime.get("season") or "",
        int(anime.get("year") or 0),
        int(anime.get("episodes_total") or 0),
        int(anime.get("episodes_aired") or 0),
        float(anime.get("rating") or 0),
        int(anime.get("score_count") or 0),
        anime.get("url_shikimori") or "",
        anime.get("next_episode_at"),
        anime.get("rating_mpaa"),
        anime.get("duration"),
        anime.get("updated_at") or synced_at,
        synced_at,
    )


def save_anime_detail(database_path: str, anime: Anime) -> None:
    """Persist the full detail payload (roles, screenshots, source) so the
    anime page can be served straight from SQLite next time."""
    ensure_anime_catalog_schema(database_path)
    upsert_anime_catalog_many(database_path, [anime])
    conn = connect(database_path)
    conn.execute(
        """
        UPDATE anime_catalog SET
            source = ?, screenshots_json = ?, directors_json = ?,
            authors_json = ?, characters_json = ?, detailed_at = ?
        WHERE id = ?
        """,
        (
            anime.get("source") or "",
            json.dumps(anime.get("screenshots") or [], ensure_ascii=False),
            json.dumps(anime.get("directors") or [], ensure_ascii=False),
            json.dumps(anime.get("authors") or [], ensure_ascii=False),
            json.dumps(anime.get("characters") or [], ensure_ascii=False),
            datetime.now(tz=UTC).isoformat(),
            int(anime["id"]),
        ),
    )
    conn.commit()


def row_to_anime(row: sqlite3.Row) -> Anime:
    anime: Anime = {
        "id": row["id"],
        "title_ru": row["title_ru"],
        "title_en": row["title_en"],
        "title_jp": row["title_jp"],
        "poster_url": row["poster_url"],
        "description": row["description"],
        "genres": json.loads(row["genres_json"] or "[]"),
        "studio": row["studio"],
        "type": row["type"],
        "status": row["status"],
        "year": row["year"],
        "episodes_total": row["episodes_total"],
        "episodes_aired": row["episodes_aired"],
        "rating": row["rating"],
        "score_count": row["score_count"],
        "url_shikimori": row["url_shikimori"],
        "updated_at": row["updated_at"],
    }
    if row["season"]:
        anime["season"] = row["season"]
    if row["next_episode_at"]:
        anime["next_episode_at"] = row["next_episode_at"]  # type: ignore[typeddict-unknown-key]
    if row["rating_mpaa"]:
        anime["rating_mpaa"] = row["rating_mpaa"]  # type: ignore[typeddict-unknown-key]
    if row["duration"]:
        anime["duration"] = row["duration"]  # type: ignore[typeddict-unknown-key]

    # Detail-page fields (present after the migration in ensure_..._schema)
    keys = row.keys()
    if "source" in keys and row["source"]:
        anime["source"] = row["source"]  # type: ignore[typeddict-unknown-key]
    for column, field in (
        ("screenshots_json", "screenshots"),
        ("directors_json", "directors"),
        ("authors_json", "authors"),
        ("characters_json", "characters"),
    ):
        if column in keys and row[column] and row[column] != "[]":
            anime[field] = json.loads(row[column])  # type: ignore[literal-required]
    if "detailed_at" in keys and row["detailed_at"]:
        anime["detailed_at"] = row["detailed_at"]  # type: ignore[typeddict-unknown-key]
    return anime
