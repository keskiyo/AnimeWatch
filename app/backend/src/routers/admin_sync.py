"""Admin endpoints for Shikimori catalog synchronisation.

Protected by the X-Admin-Token header (ADMIN_SYNC_TOKEN env). When no token
is configured (local dev) only localhost clients are allowed.
"""

import asyncio

from fastapi import APIRouter, HTTPException, Request

from src.config import get_settings
from src.db.anime_catalog_queries import get_anime_catalog_stats
from src.db.sync_state import get_all_sync_state
from src.logger import get_logger
from src.services.shikimori.sync import (
    sync_shikimori_catalog_full,
    sync_shikimori_catalog_recent,
)

log = get_logger(__name__)

router = APIRouter(prefix="/admin/sync/shikimori", tags=["admin"])

_LOCALHOST = {"127.0.0.1", "::1", "localhost", "testclient"}


def _check_access(request: Request) -> None:
    env = get_settings()
    if env.admin_sync_token:
        if request.headers.get("X-Admin-Token") != env.admin_sync_token:
            raise HTTPException(status_code=403, detail="Invalid admin token")
        return
    # No token configured (dev) — allow only localhost
    client_host = request.client.host if request.client else ""
    if client_host not in _LOCALHOST:
        raise HTTPException(
            status_code=403,
            detail="Admin sync is localhost-only until ADMIN_SYNC_TOKEN is set",
        )


def _spawn(coro_factory, sync_type: str) -> None:
    async def _run() -> None:
        try:
            await coro_factory()
        except Exception as exc:
            log.error("[admin-sync] %s sync failed: %s", sync_type, exc)

    asyncio.create_task(_run())


@router.post("/full")
async def start_full_sync(request: Request) -> dict:
    """Start the full 1990+ import in the background."""
    _check_access(request)
    _spawn(lambda: sync_shikimori_catalog_full(), "full")
    return {"status": "started", "type": "full"}


@router.post("/recent")
async def start_recent_sync(request: Request) -> dict:
    """Start the recent-years + ongoing/anons refresh in the background."""
    _check_access(request)
    _spawn(lambda: sync_shikimori_catalog_recent(), "recent")
    return {"status": "started", "type": "recent"}


@router.get("/status")
async def sync_status(request: Request) -> dict:
    """Catalog stats + sync state."""
    _check_access(request)
    env = get_settings()
    stats = get_anime_catalog_stats(env.database_path)
    stats["sync_state"] = get_all_sync_state(env.database_path)
    return stats
