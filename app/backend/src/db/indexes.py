"""Index setup — replaces the per-table ensure_*_schema calls.

Called once on startup (lifespan). All create_index calls are idempotent.
TTL indexes auto-expire sessions and cache entries (no manual cleanup).
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, TEXT


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    # Catalog: list/sort/filter + visibility
    await db.anime.create_index([("status_rank", ASCENDING), ("year", DESCENDING)])
    await db.anime.create_index("year")
    await db.anime.create_index("status")
    await db.anime.create_index("has_kodik")
    await db.anime.create_index("studio")
    await db.anime.create_index("genres")  # multikey — genre filter ($in)
    await db.anime.create_index("next_episode_at")  # schedule / upcoming sort
    await db.anime.create_index([("title_ru", TEXT), ("title_en", TEXT)])

    # TTL caches — Mongo deletes expired docs automatically
    await db.cache.create_index("expires_at", expireAfterSeconds=0)
    await db.sessions.create_index("expires_at", expireAfterSeconds=0)

    # Users / sessions
    await db.users.create_index("email_lower", unique=True)
    await db.sessions.create_index("user_id")

    # Comments tree
    await db.comments.create_index("anime_id")
    await db.comments.create_index("parent_id")

    # Watchlist: one status row per (user, anime)
    await db.watchlist.create_index(
        [("user_id", ASCENDING), ("anime_id", ASCENDING)], unique=True
    )

    # Audit log newest-first
    await db.audit_log.create_index([("created_at", DESCENDING)])
