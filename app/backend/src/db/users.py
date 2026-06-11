"""Users + sessions storage. Passwords are scrypt-hashed (stdlib, salted)."""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from src.db.anime_catalog import connect

SESSION_TTL_DAYS = 30

_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
);
"""

_SESSIONS_SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL
);
"""


def ensure_users_schema(database_path: str) -> None:
    conn = connect(database_path)
    conn.execute(_SCHEMA)
    conn.execute(_SESSIONS_SCHEMA)
    conn.commit()


# ── Password hashing (scrypt, per-user salt) ─────────────────────────────────


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split("$", 1)
        digest = hashlib.scrypt(
            password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1
        )
        return secrets.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


# ── Users ─────────────────────────────────────────────────────────────────────


def _row_to_user(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "avatar_url": row["avatar_url"],
        "role": row["role"],
        "created_at": row["created_at"],
    }


def create_user(
    database_path: str, name: str, email: str, password: str, role: str = "user"
) -> dict:
    conn = connect(database_path)
    cursor = conn.execute(
        "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
        (name, email, hash_password(password), role, datetime.now(tz=UTC).isoformat()),
    )
    conn.commit()
    return get_user_by_id(database_path, int(cursor.lastrowid or 0))  # type: ignore[return-value]


def get_user_by_id(database_path: str, user_id: int) -> dict | None:
    row = connect(database_path).execute(
        "SELECT * FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    return _row_to_user(row) if row else None


def find_user_by_login(database_path: str, login: str) -> dict | None:
    """Find a user by email OR name (case-insensitive). Includes password_hash."""
    row = connect(database_path).execute(
        "SELECT * FROM users WHERE email = ? COLLATE NOCASE OR name = ? COLLATE NOCASE",
        (login, login),
    ).fetchone()
    if not row:
        return None
    user = _row_to_user(row)
    user["password_hash"] = row["password_hash"]
    return user


def email_exists(database_path: str, email: str) -> bool:
    row = connect(database_path).execute(
        "SELECT 1 FROM users WHERE email = ? COLLATE NOCASE", (email,)
    ).fetchone()
    return row is not None


def set_user_avatar(database_path: str, user_id: int, avatar_url: str) -> None:
    conn = connect(database_path)
    conn.execute(
        "UPDATE users SET avatar_url = ? WHERE id = ?", (avatar_url, user_id)
    )
    conn.commit()


def set_user_password(database_path: str, user_id: int, password: str) -> None:
    conn = connect(database_path)
    conn.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (hash_password(password), user_id),
    )
    conn.commit()


# ── Sessions ──────────────────────────────────────────────────────────────────


def create_session(database_path: str, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(tz=UTC) + timedelta(days=SESSION_TTL_DAYS)
    conn = connect(database_path)
    conn.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
        (token, user_id, expires.isoformat()),
    )
    conn.commit()
    return token


def get_user_by_token(database_path: str, token: str) -> dict | None:
    row = connect(database_path).execute(
        "SELECT user_id, expires_at FROM sessions WHERE token = ?", (token,)
    ).fetchone()
    if not row:
        return None
    if datetime.fromisoformat(row["expires_at"]) < datetime.now(tz=UTC):
        delete_session(database_path, token)
        return None
    return get_user_by_id(database_path, row["user_id"])


def delete_session(database_path: str, token: str) -> None:
    conn = connect(database_path)
    conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
