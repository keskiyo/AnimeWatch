"""MongoDB access: a single Motor client + database handle.

Replaces the old sqlite `connect()`. The client is created lazily on first use
(inside the running event loop) and reused process-wide. Tests swap the client
for a mongomock-motor instance via `set_client`.
"""

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from src.config import get_settings

_client: AsyncIOMotorClient | None = None


def to_oid(value: object) -> ObjectId | None:
    """Coerce a str/ObjectId to ObjectId (None if not a valid id)."""
    if isinstance(value, ObjectId):
        return value
    try:
        return ObjectId(str(value))
    except Exception:
        return None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(get_settings().mongodb_uri, tz_aware=True)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    """Return the application database (collections accessed as db[name])."""
    return get_client()[get_settings().mongodb_db]


def set_client(client: AsyncIOMotorClient | None) -> None:
    """Override the client (tests inject a mongomock-motor client)."""
    global _client
    _client = client


def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
