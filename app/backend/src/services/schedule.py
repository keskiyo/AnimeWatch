"""Release schedule built from local anime_catalog rows."""

from datetime import UTC, datetime, timedelta

from src.config import get_settings
from src.db.anime_catalog_lookup import get_upcoming_anime_from_catalog


async def get_schedule(days: int, studio: str | None = None) -> dict[str, list[dict]]:
    limit_days = min(max(days, 1), 30)
    anime_list = get_upcoming_anime_from_catalog(
        get_settings().database_path,
        limit_days,
    )

    now = datetime.now(tz=UTC)
    horizon = now + timedelta(days=limit_days)
    schedule: dict[str, list[dict]] = {}

    for anime in anime_list:
        air_time = _parse_air_time(str(anime.get("next_episode_at") or ""))
        if air_time is None:
            continue
        if air_time < now - timedelta(hours=12) or air_time > horizon:
            continue

        anime_studio = (anime.get("studio") or "").strip()
        if studio and anime_studio.lower() != studio.lower():
            continue

        date_key = air_time.astimezone(UTC).date().isoformat()
        schedule.setdefault(date_key, []).append(
            {
                "anime": anime,
                "episode": int(anime.get("episodes_aired") or 0) + 1,
                "time": air_time.astimezone(UTC).isoformat().replace("+00:00", "Z"),
                "studio": anime_studio or "Неизвестно",
            }
        )

    return {
        date: sorted(entries, key=lambda entry: entry["time"])
        for date, entries in sorted(schedule.items())
    }


def _parse_air_time(value: str) -> datetime | None:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
