import asyncio

from src.config import Settings, get_settings
from src.db.anime_descriptions import (
    list_anime_without_description,
    set_anime_description,
)
from src.services.shikimori.helpers import get_cache
from src.services.yummyanime import fetch_yummyanime_description


async def backfill_missing_descriptions(
    limit: int = 100,
    settings: Settings | None = None,
) -> dict:
    env = settings or get_settings()
    rows = await list_anime_without_description(limit)
    checked = updated = found_empty = 0

    for row in rows:
        checked += 1
        description = await fetch_yummyanime_description(
            int(row["_id"]),
            str(row.get("title_ru") or ""),
            str(row.get("title_en") or ""),
            _optional_int(row.get("mal_id")),
            env.yummyanime_endpoint,
            env.yummyanime_token,
            get_cache(env),
        )
        if not description:
            found_empty += 1
            continue
        if await set_anime_description(int(row["_id"]), description):
            updated += 1
        await asyncio.sleep(0.1)

    return {
        "checked": checked,
        "updated": updated,
        "empty": found_empty,
        "remaining_batch": max(len(rows) - checked, 0),
    }


def _optional_int(value: object) -> int | None:
    try:
        result = int(value or 0)
    except (TypeError, ValueError):
        return None
    return result or None
