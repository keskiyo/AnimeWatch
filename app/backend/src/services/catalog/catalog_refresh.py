"""Catalog refresh task for the cron-triggered internal endpoint.

Wraps sync_shikimori_catalog_recent (upsert-only, never deletes) with:
  - a DB lock with TTL so parallel runs are impossible even across
    processes (cron + backend);
  - a hard timeout (CATALOG_REFRESH_TIMEOUT_MS);
  - a persisted summary/status readable via the status endpoint.
"""

import asyncio
import json
from datetime import UTC, datetime, timedelta

from src.config import Settings, get_settings
from src.db.anime_catalog_queries import get_anime_catalog_stats
from src.db.sync_state import get_sync_state, set_sync_state
from src.logger import get_logger
from src.services.shikimori.sync import sync_shikimori_catalog_recent

log = get_logger(__name__)

LOCK_KEY = "catalog-refresh-lock"
LOCK_TTL_SECONDS = 2 * 3600  # auto-expires after a crash — never stuck forever

_STATE = {
    "last_run": "catalog_refresh_last_run_at",
    "last_success": "catalog_refresh_last_success_at",
    "last_status": "catalog_refresh_last_status",
    "last_summary": "catalog_refresh_last_summary",
    "last_error": "catalog_refresh_last_error",
}


async def acquire_refresh_lock() -> bool:
    """Take the refresh lock. Returns False when a live (non-expired) run holds it."""
    now = datetime.now(tz=UTC)
    current = await get_sync_state(LOCK_KEY)
    if current:
        try:
            if datetime.fromisoformat(current) > now:
                return False
        except ValueError:
            pass  # corrupted value — treat as expired
    expires_at = now + timedelta(seconds=LOCK_TTL_SECONDS)
    await set_sync_state(LOCK_KEY, expires_at.isoformat())
    return True


async def release_refresh_lock() -> None:
    await set_sync_state(LOCK_KEY, "")


async def is_refresh_running() -> bool:
    current = await get_sync_state(LOCK_KEY)
    if not current:
        return False
    try:
        return datetime.fromisoformat(current) > datetime.now(tz=UTC)
    except ValueError:
        return False


async def get_refresh_status() -> dict:
    summary_raw = await get_sync_state(_STATE["last_summary"])
    try:
        last_summary = json.loads(summary_raw) if summary_raw else None
    except json.JSONDecodeError:
        last_summary = None
    return {
        "lastRunAt": await get_sync_state(_STATE["last_run"]),
        "lastSuccessAt": await get_sync_state(_STATE["last_success"]),
        "currentlyRunning": await is_refresh_running(),
        "lastStatus": await get_sync_state(_STATE["last_status"]),
        "lastSummary": last_summary,
        "lastError": await get_sync_state(_STATE["last_error"]) or None,
    }


async def run_catalog_refresh(settings: Settings | None = None) -> dict:
    """Run the recent-catalog refresh under lock + timeout. Returns a summary."""
    env = settings or get_settings()

    if not await acquire_refresh_lock():
        log.info("catalog_refresh_skipped_already_running")
        return {"status": "skipped_already_running"}

    started_at = datetime.now(tz=UTC).isoformat()
    await set_sync_state(_STATE["last_run"], started_at)
    await set_sync_state(_STATE["last_status"], "running")
    log.info("catalog_refresh_started started_at=%s", started_at)

    count_before = (await get_anime_catalog_stats())["count"]
    summary: dict = {"startedAt": started_at}

    try:
        timeout_s = env.catalog_refresh_timeout_ms / 1000
        result = await asyncio.wait_for(
            sync_shikimori_catalog_recent(env), timeout=timeout_s
        )

        count_after = (await get_anime_catalog_stats())["count"]
        saved = int(result.get("items_saved") or 0)
        added = max(count_after - count_before, 0)
        status = "success" if result.get("status") == "completed" else "partial_success"

        summary.update(
            status=status,
            added=added,
            updated=max(saved - added, 0),
            skipped=0,
            failed=0,
            errors=[],
        )
        await set_sync_state(_STATE["last_success"], datetime.now(tz=UTC).isoformat())
        log.info("catalog_refresh_finished status=%s saved=%d added=%d", status, saved, added)
    except TimeoutError:
        summary.update(status="failed", errors=["timeout"])
        await set_sync_state(_STATE["last_error"], "timeout")
        log.error("catalog_refresh_failed reason=timeout after %sms", env.catalog_refresh_timeout_ms)
    except Exception as exc:
        # The sync itself never deletes data — a failure leaves the catalog intact.
        summary.update(status="failed", errors=[str(exc)[:500]])
        await set_sync_state(_STATE["last_error"], str(exc)[:500])
        log.error("catalog_refresh_failed: %s", exc)
    finally:
        summary["finishedAt"] = datetime.now(tz=UTC).isoformat()
        await set_sync_state(_STATE["last_status"], summary.get("status", "failed"))
        await set_sync_state(_STATE["last_summary"], json.dumps(summary))
        await release_refresh_lock()

    return summary
