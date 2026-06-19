"""TTL cache backed by the Mongo `cache` collection.

A TTL index on `expires_at` (see db/indexes.py) auto-removes expired docs, so a
found document is normally fresh; we still return the freshness flag so callers
can use a stale value as a fallback during the short TTL-monitor window.
"""

from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Any


class CacheStore:
    @property
    def _coll(self):
        from src.db.mongo import get_db

        return get_db().cache

    async def get_json(self, key: str) -> tuple[Any, bool] | None:
        doc = await self._coll.find_one({"_id": key})
        if not doc:
            return None
        expires = doc.get("expires_at")
        fresh = bool(expires and expires > datetime.now(tz=UTC))
        return doc.get("value"), fresh

    async def set_json(self, key: str, value: object, ttl_seconds: int) -> None:
        now = datetime.now(tz=UTC)
        await self._coll.update_one(
            {"_id": key},
            {"$set": {"value": value, "expires_at": now + timedelta(seconds=ttl_seconds),
                      "updated_at": now}},
            upsert=True,
        )

    async def delete(self, key: str) -> None:
        await self._coll.delete_one({"_id": key})


_store = CacheStore()


def get_cache(*_args) -> CacheStore:
    """Shared cache instance (the optional arg is ignored, kept for callers)."""
    return _store


async def get_cached_json(
    cache: CacheStore,
    key: str,
    ttl_seconds: int,
    fetcher: Callable[[], Awaitable[object]],
) -> object:
    cached = await cache.get_json(key)
    if cached and cached[1]:
        return cached[0]
    value = await fetcher()
    await cache.set_json(key, value, ttl_seconds)
    return value
