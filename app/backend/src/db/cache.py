import json
import sqlite3
import time
from collections.abc import Callable
from pathlib import Path
from typing import TypeVar


T = TypeVar("T")


class CacheStore:
    def __init__(self, database_path: str) -> None:
        if database_path != ":memory:":
            Path(database_path).resolve().parent.mkdir(parents=True, exist_ok=True)

        self.connection = sqlite3.connect(database_path, check_same_thread=False)
        self.connection.execute(
            """
            CREATE TABLE IF NOT EXISTS api_cache (
                key TEXT PRIMARY KEY,
                value_json TEXT NOT NULL,
                expires_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
            """
        )

    def get_json(self, key: str, now_seconds: int | None = None) -> tuple[T, bool] | None:
        now = now_seconds if now_seconds is not None else int(time.time())
        row = self.connection.execute(
            "SELECT value_json, expires_at FROM api_cache WHERE key = ?",
            (key,),
        ).fetchone()
        if row is None:
            return None

        try:
            value = json.loads(row[0])
        except json.JSONDecodeError:
            self.delete(key)
            return None

        return value, int(row[1]) >= now

    def set_json(self, key: str, value: object, ttl_seconds: int) -> None:
        now = int(time.time())
        self.connection.execute(
            """
            INSERT INTO api_cache (key, value_json, expires_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value_json = excluded.value_json,
                expires_at = excluded.expires_at,
                updated_at = excluded.updated_at
            """,
            (key, json.dumps(value), now + ttl_seconds, now),
        )
        self.connection.commit()

    def delete(self, key: str) -> None:
        self.connection.execute("DELETE FROM api_cache WHERE key = ?", (key,))
        self.connection.commit()


async def get_cached_json(
    cache: CacheStore,
    key: str,
    ttl_seconds: int,
    fetcher: Callable[[], object],
) -> object:
    cached = cache.get_json(key)
    if cached and cached[1]:
        return cached[0]

    value = await fetcher()
    cache.set_json(key, value, ttl_seconds)
    return value
