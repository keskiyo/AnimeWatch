"""Refresh the has_kodik flag across the catalog from a full Kodik /list crawl.

One crawl marks every catalog title (1 = has dubbing, 0 = none) instead of
querying Kodik per title. Flags are written only when the crawl fully succeeds
and returns a non-empty set, so a network failure never hides the whole catalog.
"""

from datetime import UTC, datetime

from src.config import Settings, get_settings
from src.db.anime_catalog import mark_kodik_availability
from src.db.sync_state import set_sync_state
from src.logger import get_logger
from src.services.kodik.client import iter_kodik_shikimori_ids

log = get_logger(__name__)


async def refresh_kodik_availability(settings: Settings | None = None) -> dict:
    env = settings or get_settings()

    if not env.kodik_api_key:
        log.warning("[kodik] availability refresh skipped — no KODIK_API_KEY")
        return {"status": "skipped", "reason": "no_token"}

    try:
        kodik_ids = await iter_kodik_shikimori_ids(env)
    except Exception as exc:  # transient — leave existing flags untouched
        log.warning("[kodik] availability crawl failed: %s — flags unchanged", exc)
        await set_sync_state("kodik_availability_status", "failed")
        await set_sync_state("kodik_availability_last_error", str(exc))
        return {"status": "failed", "error": str(exc)}

    # A "successful" crawl that returns nothing is suspicious (token/types issue);
    # marking everyone as 0 would empty the catalog — refuse to do it.
    if not kodik_ids:
        log.warning("[kodik] availability crawl returned 0 ids — flags unchanged")
        await set_sync_state("kodik_availability_status", "empty")
        return {"status": "empty"}

    counts = await mark_kodik_availability(kodik_ids)
    await set_sync_state("kodik_availability_status", "completed")
    await set_sync_state(
        "kodik_availability_last_run_at", datetime.now(tz=UTC).isoformat()
    )
    await set_sync_state(
        "kodik_availability_counts", f"{counts['with']}/{counts['without']}"
    )
    log.info(
        "[kodik] availability refreshed: %d with dubbing, %d without",
        counts["with"],
        counts["without"],
    )
    return {"status": "completed", **counts}
