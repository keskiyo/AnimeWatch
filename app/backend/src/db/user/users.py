"""Users + sessions (Mongo). Passwords are scrypt-hashed (stdlib, salted)."""

import hashlib
import re
import secrets
from datetime import UTC, datetime, timedelta

from src.db.mongo import get_db, to_oid

SESSION_TTL_DAYS = 30


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


def _to_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "avatar_url": doc.get("avatar_url", ""),
        "role": doc.get("role", "user"),
        "created_at": doc.get("created_at", ""),
    }


async def create_user(
    name: str, email: str, password: str, role: str = "user"
) -> dict:
    doc = {
        "name": name,
        "email": email,
        "email_lower": email.lower(),
        "password_hash": hash_password(password),
        "avatar_url": "",
        "role": role,
        "created_at": datetime.now(tz=UTC).isoformat(),
        "is_blocked": 0,
        "blocked_at": "",
        "last_seen_at": "",
    }
    result = await get_db().users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_user(doc)


async def get_user_by_id(user_id: object) -> dict | None:
    oid = to_oid(user_id)
    if oid is None:
        return None
    doc = await get_db().users.find_one({"_id": oid})
    return _to_user(doc) if doc else None


async def find_user_by_login(login: str) -> dict | None:
    """By email OR name (case-insensitive). Includes password_hash."""
    rx = {"$regex": f"^{re.escape(login)}$", "$options": "i"}
    doc = await get_db().users.find_one(
        {"$or": [{"email_lower": login.lower()}, {"name": rx}]}
    )
    if not doc:
        return None
    user = _to_user(doc)
    user["password_hash"] = doc.get("password_hash", "")
    return user


async def email_exists(email: str) -> bool:
    return await get_db().users.find_one({"email_lower": email.lower()}) is not None


async def set_user_avatar(user_id: object, avatar_url: str) -> None:
    await get_db().users.update_one(
        {"_id": to_oid(user_id)}, {"$set": {"avatar_url": avatar_url}}
    )


async def set_user_name(user_id: object, name: str) -> dict | None:
    await get_db().users.update_one({"_id": to_oid(user_id)}, {"$set": {"name": name}})
    return await get_user_by_id(user_id)


async def set_user_password(user_id: object, password: str) -> None:
    await get_db().users.update_one(
        {"_id": to_oid(user_id)}, {"$set": {"password_hash": hash_password(password)}}
    )


# ── Sessions (TTL index on expires_at auto-removes expired) ─────────────────────


async def create_session(user_id: object) -> str:
    token = secrets.token_urlsafe(32)
    await get_db().sessions.insert_one(
        {
            "_id": token,
            "user_id": to_oid(user_id),
            "expires_at": datetime.now(tz=UTC) + timedelta(days=SESSION_TTL_DAYS),
        }
    )
    return token


async def get_user_by_token(token: str) -> dict | None:
    doc = await get_db().sessions.find_one({"_id": token})
    if not doc:
        return None
    if doc["expires_at"] < datetime.now(tz=UTC):
        await delete_session(token)
        return None
    return await get_user_by_id(doc["user_id"])


async def delete_session(token: str) -> None:
    await get_db().sessions.delete_one({"_id": token})
