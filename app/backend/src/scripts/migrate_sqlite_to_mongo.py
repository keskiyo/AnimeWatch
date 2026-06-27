"""One-time migration: legacy SQLite user data → MongoDB.

Moves accounts, sessions, comments (+votes), watchlist, library
(progress/settings/notifications), static pages and the admin audit log.
Integer primary keys become ObjectIds; foreign keys are remapped accordingly.

The CATALOG is NOT migrated — it is derived data; re-sync it instead:
    python -m src.scripts.sync_shikimori full
    python -m src.scripts.sync_shikimori kodik

Usage (from app/backend), with MONGODB_URI / LEGACY_SQLITE_PATH set in .env:
    python -m src.scripts.migrate_sqlite_to_mongo
"""

import json
import sqlite3
import sys
from datetime import UTC, datetime
from pathlib import Path

from bson import ObjectId
from pymongo import MongoClient

from src.config import get_settings


def _connect_sqlite(path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def _table_exists(conn: sqlite3.Connection, name: str) -> bool:
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (name,)
    ).fetchone()
    return row is not None


def _rows(conn: sqlite3.Connection, table: str) -> list[sqlite3.Row]:
    if not _table_exists(conn, table):
        return []
    return conn.execute(f"SELECT * FROM {table}").fetchall()


def _parse_dt(value: str | None) -> datetime:
    if not value:
        return datetime.now(tz=UTC)
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(tz=UTC)
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def _json_or(value: str | None, fallback):
    try:
        return json.loads(value) if value else fallback
    except (json.JSONDecodeError, TypeError):
        return fallback


def migrate(sqlite_path: str, db, avatars_dir: Path) -> dict:
    conn = _connect_sqlite(sqlite_path)
    counts: dict[str, int] = {}
    user_ids: dict[int, ObjectId] = {}
    comment_ids: dict[int, ObjectId] = {}

    # ── users (+ avatar file remap int→ObjectId) ─────────────────────────────
    user_docs = []
    avatars_remapped = 0
    for row in _rows(conn, "users"):
        oid = ObjectId()
        old_id = int(row["id"])
        user_ids[old_id] = oid
        email = row["email"] or ""
        # Avatars on disk are named by the OLD int id; rename to the new
        # ObjectId so /api/avatars/{oid} resolves. Drop stale urls if no file.
        avatar_url = row["avatar_url"] or ""
        if avatar_url:
            src = avatars_dir / f"{old_id}.webp"
            if src.exists():
                src.rename(avatars_dir / f"{oid}.webp")
                avatar_url = f"/api/avatars/{oid}"
                avatars_remapped += 1
            else:
                avatar_url = ""  # file missing → frontend shows fallback
        user_docs.append(
            {
                "_id": oid,
                "name": row["name"] or "",
                "email": email,
                "email_lower": email.lower(),
                "password_hash": row["password_hash"] or "",
                "avatar_url": avatar_url,
                "role": row["role"] or "user",
                "created_at": row["created_at"] or "",
                "is_blocked": int(_col(row, "is_blocked", 0) or 0),
                "blocked_at": _col(row, "blocked_at", "") or "",
                "last_seen_at": _col(row, "last_seen_at", "") or "",
            }
        )
    if user_docs:
        db.users.insert_many(user_docs)
    counts["users"] = len(user_docs)
    counts["avatars_remapped"] = avatars_remapped

    # ── sessions ───────────────────────────────────────────────────────────
    session_docs = []
    for row in _rows(conn, "sessions"):
        uid = user_ids.get(int(row["user_id"]))
        if uid is None:
            continue
        session_docs.append(
            {
                "_id": row["token"],
                "user_id": uid,
                "expires_at": _parse_dt(_col(row, "expires_at", None)),
            }
        )
    if session_docs:
        db.sessions.insert_many(session_docs)
    counts["sessions"] = len(session_docs)

    # ── comments (+ embedded votes) ──────────────────────────────────────────
    raw_comments = _rows(conn, "comments")
    for row in raw_comments:
        comment_ids[int(row["id"])] = ObjectId()

    votes_by_comment: dict[int, list[dict]] = {}
    for row in _rows(conn, "comment_votes"):
        uid = user_ids.get(int(row["user_id"]))
        if uid is None:
            continue
        votes_by_comment.setdefault(int(row["comment_id"]), []).append(
            {"user_id": uid, "value": int(row["value"])}
        )

    comment_docs = []
    for row in raw_comments:
        old_id = int(row["id"])
        uid = user_ids.get(int(row["user_id"]))
        if uid is None:
            continue
        parent_old = _col(row, "parent_id", None)
        parent_oid = comment_ids.get(int(parent_old)) if parent_old else None
        comment_docs.append(
            {
                "_id": comment_ids[old_id],
                "anime_id": int(row["anime_id"]),
                "user_id": uid,
                "parent_id": parent_oid,
                "text": row["text"] or "",
                "created_at": row["created_at"] or "",
                "votes": votes_by_comment.get(old_id, []),
            }
        )
    if comment_docs:
        db.comments.insert_many(comment_docs)
    counts["comments"] = len(comment_docs)

    # ── watchlist_categories → watchlist (per-user) ──────────────────────────
    wl_docs = []
    for row in _rows(conn, "watchlist_categories"):
        uid = user_ids.get(int(row["user_id"]))
        if uid is None:
            continue
        wl_docs.append(
            {
                "user_id": uid,
                "anime_id": int(row["anime_id"]),
                "status": row["status"],
                "added_at": _col(row, "added_at", "") or "",
            }
        )
    if wl_docs:
        db.watchlist.insert_many(wl_docs)
    counts["watchlist"] = len(wl_docs)

    # NOTE: legacy progress/app_kv/notifications were GLOBAL (no user owner) and
    # are now per-user — anonymous global rows can't be attributed, so they are
    # intentionally NOT migrated. Users re-create progress/settings after login.

    # ── static_pages ─────────────────────────────────────────────────────────
    sp_docs = []
    for row in _rows(conn, "static_pages"):
        by_old = _col(row, "updated_by", None)
        sp_docs.append(
            {
                "_id": row["slug"],
                "title": row["title"] or "",
                "content": row["content"] or "",
                "updated_at": _col(row, "updated_at", "") or "",
                "updated_by": user_ids.get(int(by_old)) if by_old else None,
            }
        )
    for doc in sp_docs:
        db.static_pages.replace_one({"_id": doc["_id"]}, doc, upsert=True)
    counts["static_pages"] = len(sp_docs)

    # ── admin_audit_log → audit_log ──────────────────────────────────────────
    audit_docs = []
    for row in _rows(conn, "admin_audit_log"):
        audit_docs.append(
            {
                "admin_user_id": user_ids.get(int(row["admin_user_id"])),
                "action": row["action"] or "",
                "target_type": row["target_type"] or "",
                "target_id": row["target_id"] or "",
                "metadata": _json_or(_col(row, "metadata_json", None), {}),
                "created_at": row["created_at"] or "",
            }
        )
    if audit_docs:
        db.audit_log.insert_many(audit_docs)
    counts["audit_log"] = len(audit_docs)

    conn.close()
    return counts


def _col(row: sqlite3.Row, name: str, default):
    """Read a column that may not exist in older SQLite schemas."""
    return row[name] if name in row.keys() else default


def main() -> int:
    env = get_settings()
    sqlite_path = env.legacy_sqlite_path
    avatars_dir = Path(env.data_dir).resolve() / "avatars"
    print(f"Source SQLite: {sqlite_path}")
    print(f"Target Mongo:  {env.mongodb_uri} / {env.mongodb_db}")
    print(f"Avatars dir:   {avatars_dir}")

    client = MongoClient(env.mongodb_uri, tz_aware=True)
    try:
        counts = migrate(sqlite_path, client[env.mongodb_db], avatars_dir)
    finally:
        client.close()

    print("Migrated:")
    for name, n in counts.items():
        print(f"  {name}: {n}")
    print("Now re-sync the catalog: python -m src.scripts.sync_shikimori full")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
