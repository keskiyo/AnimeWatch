"""Internal catalog-refresh endpoints (cron-triggered, Bearer-token protected).

POST /internal/catalog/refresh        — start a refresh (202) or report 409
GET  /internal/catalog/refresh/status — last run status/summary
"""

import asyncio
import secrets

from fastapi import APIRouter, Header, HTTPException

from src.config import get_settings
from src.logger import get_logger
from src.services.catalog.catalog_refresh import (
    get_refresh_status,
    is_refresh_running,
    run_catalog_refresh,
)

log = get_logger(__name__)

router = APIRouter(prefix="/internal/catalog", tags=["internal"])


def _check_token(authorization: str | None) -> None:
    env = get_settings()
    if not env.catalog_refresh_token:
        # No token configured — endpoint must not be reachable at all.
        raise HTTPException(
            status_code=503, detail="CATALOG_REFRESH_TOKEN is not configured"
        )
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    provided = authorization.removeprefix("Bearer ").strip()
    if not secrets.compare_digest(provided, env.catalog_refresh_token):
        raise HTTPException(status_code=403, detail="Invalid token")


@router.post("/refresh", status_code=202)
async def trigger_catalog_refresh(
    authorization: str | None = Header(default=None),
) -> dict:
    """Start the recent-catalog refresh in the background (non-blocking)."""
    _check_token(authorization)
    env = get_settings()

    if is_refresh_running(env.database_path):
        raise HTTPException(status_code=409, detail="refresh already running")

    async def _run() -> None:
        try:
            await run_catalog_refresh(env)
        except Exception as exc:
            log.error("catalog_refresh_failed (background): %s", exc)

    asyncio.create_task(_run())
    return {"status": "started", "type": "recent"}


@router.get("/refresh/status")
async def catalog_refresh_status(
    authorization: str | None = Header(default=None),
) -> dict:
    _check_token(authorization)
    return get_refresh_status(get_settings().database_path)
