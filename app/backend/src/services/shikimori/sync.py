"""Shikimori → SQLite catalog synchronisation (orchestration).

Architecture:
  - the permanent `anime_catalog` table (src/db/anime_catalog.py) is the
    source of truth for /api/anime/bulk — it survives restarts;
  - FULL sync (manual: CLI or POST /admin/sync/shikimori/full) walks years
    to_year → from_year, seasons winter/spring/summer/fall;
  - RECENT sync (daily, auto on startup) refreshes only from_year..now
    plus all ongoing/anons titles;
  - id discovery and GQL detail batches live in sync_sources.py; everything
    is sequential behind a conservative rate limiter (~70 rpm, limit 90);
  - sync NEVER deletes rows, only upserts.
"""

import asyncio
from datetime import UTC, datetime

from src.config import Settings, get_settings
from src.db.anime_catalog import upsert_anime_catalog_many
from src.db.anime_catalog_queries import get_anime_catalog_all
from src.db.sync_state import get_sync_state, set_sync_state
from src.logger import get_logger
from src.models import Anime
from src.services.shikimori.normalizers import normalize_shikimori_gql_anime
from src.services.shikimori.rate_limit import sync_rate_limiter
from src.services.shikimori.sync_sources import (
    GQL_BATCH_SIZE,
    SEASONS,
    fetch_shikimori_gql_animes_by_ids,
    fetch_shikimori_ids_by_season,
    fetch_status_ids,
)

log = get_logger(__name__)

_RECENT_DEFAULT_FROM_YEAR = 2026
_AUTO_REFRESH_INTERVAL_SECONDS = 24 * 3600

# In-process guard: never run two syncs at once in the same backend
_sync_lock = asyncio.Lock()


# ── Full sync (1990 → today) ─────────────────────────────────────────────────


async def sync_shikimori_catalog_full(
    settings: Settings | None = None,
    from_year: int = 1990,
    to_year: int | None = None,
) -> dict:
    """Import the whole catalog year by year. Slow, manual, restart-safe."""
    env = settings or get_settings()
    to_year = to_year or datetime.now(tz=UTC).year
    started_at = datetime.now(tz=UTC).isoformat()

    if _sync_lock.locked():
        log.warning("[sync-full] another sync is already running — skipping")
        return {"status": "already_running"}

    async with _sync_lock:
        await set_sync_state("shikimori_full_sync_status", "running")
        log.info("[sync-full] started from_year=%d to_year=%d", from_year, to_year)

        ids_found = 0
        items_saved = 0
        years_processed = 0

        try:
            for year in range(to_year, from_year - 1, -1):
                year_ids: list[int] = []
                for season in SEASONS:
                    try:
                        season_ids = await fetch_shikimori_ids_by_season(
                            year, season, env, sync_rate_limiter
                        )
                    except Exception as exc:
                        # Network blip (ConnectError etc.) must not kill the
                        # whole multi-hour run — skip the season, keep going.
                        log.warning(
                            "[sync-full] year=%d season=%s skipped: %s",
                            year, season, exc,
                        )
                        await asyncio.sleep(5)
                        continue
                    log.info(
                        "[sync-full] year=%d season=%s ids=%d",
                        year,
                        season,
                        len(season_ids),
                    )
                    year_ids.extend(season_ids)

                unique_ids = sorted(set(year_ids))
                ids_found += len(unique_ids)

                saved = await _fetch_and_save(unique_ids, env)
                items_saved += saved
                years_processed += 1

                await set_sync_state("shikimori_last_synced_year", str(year))
                log.info(
                    "[sync-full] year=%d saved=%d total_saved=%d",
                    year,
                    saved,
                    items_saved,
                )
        except Exception as exc:
            await set_sync_state("shikimori_last_error", str(exc))
            await set_sync_state("shikimori_full_sync_status", "failed")
            log.error("[sync-full] failed: %s", exc)
            raise

        completed_at = datetime.now(tz=UTC).isoformat()
        await set_sync_state("shikimori_full_sync_completed_at", completed_at)
        await set_sync_state("shikimori_full_sync_status", "completed")
        log.info("[sync-full] completed total_saved=%d", items_saved)

        await _refresh_kodik_flags(env)

        return {
            "status": "completed",
            "from_year": from_year,
            "to_year": to_year,
            "years_processed": years_processed,
            "ids_found": ids_found,
            "items_saved": items_saved,
            "started_at": started_at,
            "completed_at": completed_at,
        }


# ── Recent sync (current years + ongoing/anons) ──────────────────────────────


async def sync_shikimori_catalog_recent(
    settings: Settings | None = None,
    from_year: int = _RECENT_DEFAULT_FROM_YEAR,
) -> dict:
    """Refresh only recent years plus every ongoing/announced title."""
    env = settings or get_settings()
    to_year = datetime.now(tz=UTC).year
    from_year = min(from_year, to_year)
    started_at = datetime.now(tz=UTC).isoformat()

    if _sync_lock.locked():
        log.warning("[sync-recent] another sync is already running — skipping")
        return {"status": "already_running"}

    async with _sync_lock:
        await set_sync_state("shikimori_recent_sync_status", "running")
        log.info("[sync-recent] started from_year=%d", from_year)

        items_saved = 0
        try:
            all_ids: set[int] = set()

            for year in range(to_year, from_year - 1, -1):
                for season in SEASONS:
                    try:
                        season_ids = await fetch_shikimori_ids_by_season(
                            year, season, env, sync_rate_limiter
                        )
                        all_ids.update(season_ids)
                    except Exception as exc:
                        log.warning(
                            "[sync-recent] year=%d season=%s skipped: %s",
                            year, season, exc,
                        )
                        await asyncio.sleep(5)

            # Ongoing/announced titles can have started in older years —
            # refresh them too so episode counts/next_episode_at stay fresh.
            status_ids = await fetch_status_ids("ongoing,anons", env, sync_rate_limiter)
            all_ids.update(status_ids)

            items_saved = await _fetch_and_save(sorted(all_ids), env)
        except Exception as exc:
            await set_sync_state("shikimori_last_error", str(exc))
            await set_sync_state("shikimori_recent_sync_status", "failed")
            log.error("[sync-recent] failed: %s", exc)
            raise

        completed_at = datetime.now(tz=UTC).isoformat()
        await set_sync_state("shikimori_recent_sync_completed_at", completed_at)
        await set_sync_state("shikimori_recent_sync_status", "completed")
        log.info("[sync-recent] completed total_saved=%d", items_saved)

        await _refresh_kodik_flags(env)

        return {
            "status": "completed",
            "from_year": from_year,
            "to_year": to_year,
            "items_saved": items_saved,
            "started_at": started_at,
            "completed_at": completed_at,
        }


async def _refresh_kodik_flags(env: Settings) -> None:
    """Recompute has_kodik flags after the catalog changed. Never fails the sync."""
    try:
        from src.services.kodik.availability import refresh_kodik_availability

        await refresh_kodik_availability(env)
    except Exception as exc:  # pragma: no cover - defensive
        log.warning("[sync] kodik availability refresh skipped: %s", exc)


async def _fetch_and_save(ids: list[int], env: Settings) -> int:
    """Fetch GQL details for ids in batches and upsert them. Returns rows saved."""
    if not ids:
        return 0
    saved = 0
    now_iso = datetime.now(tz=UTC).isoformat()
    for i in range(0, len(ids), GQL_BATCH_SIZE):
        batch_ids = ids[i : i + GQL_BATCH_SIZE]
        raw_items = await fetch_shikimori_gql_animes_by_ids(
            batch_ids, env, sync_rate_limiter
        )
        items: list[Anime] = []
        for raw in raw_items:
            try:
                items.append(normalize_shikimori_gql_anime(raw, now_iso))
            except Exception:
                continue
        saved += await upsert_anime_catalog_many(items)
    return saved


# ── Weekly auto-refresh (startup hook) ───────────────────────────────────────


async def maybe_start_daily_recent_sync(settings: Settings | None = None) -> None:
    """If the last recent sync is older than 24 hours (or missing), run one in
    the background. Never blocks startup, never starts a second sync."""
    env = settings or get_settings()

    last = await get_sync_state("shikimori_recent_sync_completed_at")
    if last:
        try:
            last_dt = datetime.fromisoformat(last)
            age = (datetime.now(tz=UTC) - last_dt).total_seconds()
            if age < _AUTO_REFRESH_INTERVAL_SECONDS:
                log.info(
                    "[sync-recent] last run %.1f days ago — skipping", age / 86400
                )
                return
        except ValueError:
            pass

    if _sync_lock.locked():
        log.info("[sync-recent] sync already running — skipping daily check")
        return

    log.info("[sync-recent] daily refresh due — starting in background")

    async def _run() -> None:
        try:
            await sync_shikimori_catalog_recent(env)
        except Exception as exc:
            log.error("[sync-recent] background run failed: %s", exc)

    asyncio.create_task(_run())


# ── Bulk catalog: reads from the local table ─────────────────────────────────


async def fetch_shikimori_bulk_catalog(settings: Settings | None = None) -> list[Anime]:
    """Return the full catalog FROM THE LOCAL SQLite TABLE.

    Shikimori is NOT called here. If the table is empty:
      - with ALLOW_SHIKIMORI_BULK_FALLBACK=true → legacy direct GQL fetch;
      - otherwise → empty list (run the sync first).
    """
    env = settings or get_settings()

    items = await get_anime_catalog_all()
    if items:
        return items

    if env.allow_shikimori_bulk_fallback:
        log.warning(
            "[bulk] anime_catalog is empty — legacy Shikimori fallback enabled"
        )
        from src.services.shikimori.legacy_bulk import (
            legacy_fetch_bulk_from_shikimori,
        )

        return await legacy_fetch_bulk_from_shikimori(env)

    log.warning(
        "[bulk] anime_catalog is empty — run: python -m src.scripts.sync_shikimori full"
    )
    return []
