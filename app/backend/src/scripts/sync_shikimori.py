"""Shikimori catalog sync CLI.

Usage (from app/backend):
    python -m src.scripts.sync_shikimori full      # initial 1990+ import (slow)
    python -m src.scripts.sync_shikimori recent    # refresh recent years + ongoing
    python -m src.scripts.sync_shikimori status    # catalog stats + sync state
"""

import asyncio
import json
import sys

from src.config import get_settings
from src.db.anime_catalog import ensure_anime_catalog_schema
from src.db.anime_catalog_queries import get_anime_catalog_stats
from src.db.sync_state import get_all_sync_state
from src.logger import configure_logging
from src.services.shikimori.sync import (
    sync_shikimori_catalog_full,
    sync_shikimori_catalog_recent,
)


def _print_status() -> None:
    env = get_settings()
    ensure_anime_catalog_schema(env.database_path)
    stats = get_anime_catalog_stats(env.database_path)
    stats["sync_state"] = get_all_sync_state(env.database_path)
    print(json.dumps(stats, ensure_ascii=False, indent=2))


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
    if command == "status":
        _print_status()
        return 0

    print(__doc__)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
