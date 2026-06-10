import asyncio
from datetime import UTC, datetime, timedelta

from src.config import get_settings
from src.logger import get_logger
from src.services.catalog import get_anime_by_id
from src.services.kodik import (
    extract_episode_titles,
    get_kodik_search_results,
    normalize_kodik_player_result,
)
from src.services.shikimori import fetch_shikimori_ongoing

log = get_logger(__name__)


async def get_episodes_for_anime(anime_id: int) -> list[dict]:
    """Build the episode list from real data: Kodik (links, titles, dubbing) + Shikimori (aired count, next episode)."""
    if anime_id <= 0:
        return []

    anime, results = await asyncio.gather(
        get_anime_by_id(anime_id),
        get_kodik_search_results(anime_id),
    )

    kodik_count = 0
    titles: dict[str, str] = {}
    dubbing_studios: list[str] = []
    kodik_url: str | None = None
    kodik_quality: str | None = None

    for result in results:
        normalized = normalize_kodik_player_result(result)
        if not normalized.get("available"):
            continue
        count = max(
            int(normalized.get("episodes_count") or 0),
            int(result.get("last_episode") or 0) if isinstance(result.get("last_episode"), int | float) else 0,
        )
        kodik_count = max(kodik_count, count)
        for number, title in extract_episode_titles(result).items():
            titles.setdefault(number, title)
        translation = normalized.get("translation")
        if translation and translation not in dubbing_studios:
            dubbing_studios.append(translation)
        if kodik_url is None:
            kodik_url = normalized["link"]
            kodik_quality = normalized.get("quality")

    episodes_aired = int(anime.get("episodes_aired") or 0) if anime else 0
    total = max(kodik_count, episodes_aired)
    duration = anime.get("duration") if anime else None

    episodes = [
        {
            "id": f"{anime_id}-{number}",
            "anime_id": anime_id,
            "episode_number": number,
            "title": titles.get(str(number)),
            "release_date_jp": None,
            "release_date_dub": None,
            "duration": duration,
            "players": (
                {"kodik": {"url": kodik_url, "quality": [kodik_quality] if kodik_quality else []}}
                if kodik_url
                else {}
            ),
            "dubbing_studios": dubbing_studios,
        }
        for number in range(1, total + 1)
    ]

    # Upcoming episode with a real air date from Shikimori
    next_at = (anime or {}).get("next_episode_at")
    if anime and anime.get("status") == "ongoing" and next_at:
        upcoming_number = episodes_aired + 1
        if upcoming_number > total:
            episodes.append(
                {
                    "id": f"{anime_id}-{upcoming_number}",
                    "anime_id": anime_id,
                    "episode_number": upcoming_number,
                    "title": titles.get(str(upcoming_number)),
                    "release_date_jp": next_at,
                    "release_date_dub": None,
                    "duration": duration,
                    "players": {},
                    "dubbing_studios": [],
                }
            )
        else:
            episodes[upcoming_number - 1]["release_date_jp"] = next_at

    return episodes


async def get_schedule(days: int, studio: str | None = None) -> dict[str, list[dict]]:
    """Release schedule built from Shikimori ongoing anime (nextEpisodeAt), grouped by date."""
    limit_days = min(max(days, 1), 30)
    ongoing = await fetch_shikimori_ongoing(get_settings())

    now = datetime.now(tz=UTC)
    horizon = now + timedelta(days=limit_days)
    schedule: dict[str, list[dict]] = {}

    for anime in ongoing:
        next_at = anime.get("next_episode_at")
        if not next_at:
            continue
        try:
            air_time = datetime.fromisoformat(str(next_at).replace("Z", "+00:00"))
        except ValueError:
            continue
        # Keep today's already-aired entries; drop anything past the horizon
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


def get_studios(kodik_configured: bool) -> list[dict]:
    return [
        {
            "name": "Kodik",
            "available": kodik_configured,
            "api_status": "configured" if kodik_configured else "needs-token",
        },
    ]


async def get_studio_anime_availability(name: str, anime_id: int) -> dict:
    """Episode availability per dubbing studio, from real Kodik translation data."""
    results = await get_kodik_search_results(anime_id)

    all_episodes: set[int] = set()
    available: set[int] = set()
    for result in results:
        count = max(
            int(result.get("episodes_count") or 0) if isinstance(result.get("episodes_count"), int | float) else 0,
            int(result.get("last_episode") or 0) if isinstance(result.get("last_episode"), int | float) else 0,
        )
        if count <= 0:
            continue
        episodes = set(range(1, count + 1))
        all_episodes |= episodes
        translation = result.get("translation") if isinstance(result.get("translation"), dict) else {}
        title = (translation or {}).get("title") or ""
        if name and title.lower() == name.lower():
            available |= episodes

    return {"episodes": sorted(all_episodes), "available_episodes": sorted(available)}


def get_aniboom_player(anime_id: int, episode_number: int) -> dict:
    return {"url": f"https://aniboom.one/embed/{anime_id}-{episode_number}"}
