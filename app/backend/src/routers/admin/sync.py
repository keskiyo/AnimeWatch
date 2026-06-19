"""Admin endpoints for Shikimori catalog synchronisation.

Protected by the X-Admin-Token header (ADMIN_SYNC_TOKEN env). The token is
REQUIRED: client IP is never trusted (behind a reverse proxy request.client.host
is the proxy, often 127.0.0.1, so an IP allow-list would expose admin sync). The
CLI runs the sync functions directly, so it doesn't need this HTTP route.
"""

import asyncio
import secrets

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


def _check_access(request: Request) -> None:
    token = get_settings().admin_sync_token
    if not token:
        raise HTTPException(
            status_code=403, detail="Admin sync disabled: set ADMIN_SYNC_TOKEN"
        )
    provided = request.headers.get("X-Admin-Token") or ""
    if not secrets.compare_digest(provided, token):
        raise HTTPException(status_code=403, detail="Invalid admin token")


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
    stats = await get_anime_catalog_stats()
    stats["sync_state"] = await get_all_sync_state()
    return stats
