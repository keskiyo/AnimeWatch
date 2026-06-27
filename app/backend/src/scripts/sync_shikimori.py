"""Shikimori catalog sync CLI.

Usage (from app/backend):
    python -m src.scripts.sync_shikimori full      # initial 1990+ import (slow)
    python -m src.scripts.sync_shikimori recent    # refresh recent years + ongoing
    python -m src.scripts.sync_shikimori kodik     # refresh has_kodik flags only
    python -m src.scripts.sync_shikimori descriptions [limit]
    python -m src.scripts.sync_shikimori status    # catalog stats + sync state
"""

import asyncio
import json
import sys

from src.db.anime_catalog_queries import get_anime_catalog_stats
from src.db.sync_state import get_all_sync_state
from src.logger import configure_logging
from src.services.catalog.descriptions import backfill_missing_descriptions
from src.services.kodik.availability import refresh_kodik_availability
from src.services.shikimori.sync import (
    sync_shikimori_catalog_full,
    sync_shikimori_catalog_recent,
)


def _print_status() -> None:
    async def _run() -> dict:
        stats = await get_anime_catalog_stats()
        stats["sync_state"] = await get_all_sync_state()
        return stats

    print(json.dumps(asyncio.run(_run()), ensure_ascii=False, indent=2))


def main() -> int:
    configure_logging()
    command = sys.argv[1] if len(sys.argv) > 1 else ""

    if command == "full":
        result = asyncio.run(sync_shikimori_catalog_full(from_year=1990))
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    if command == "recent":
        result = asyncio.run(sync_shikimori_catalog_recent())
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    if command == "kodik":
        result = asyncio.run(refresh_kodik_availability())
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    if command == "descriptions":
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 100
        result = asyncio.run(backfill_missing_descriptions(limit=limit))
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    if command == "status":
        _print_status()
        return 0

    print(__doc__)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
