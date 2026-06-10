"""Normalize raw Kodik payloads into the app's player shape."""

from typing import Any

from src.services.kodik.client import (
    absolute_link,
    is_allowed_url,
    positive_number,
)


def unavailable_player(message: str) -> dict:
    return {"available": False, "provider": "kodik", "message": message}


def normalize_kodik_player_result(result: dict[str, Any] | None) -> dict:
    if not result:
        return unavailable_player("Kodik player was not found")

    link = absolute_link(result.get("link"))
    if not is_allowed_url(link):
        return unavailable_player("Kodik player URL is not allowed")

    translation = (
        result.get("translation")
        if isinstance(result.get("translation"), dict)
        else {}
    )
    return {
        "available": True,
        "provider": "kodik",
        "link": link,
        "translation": translation.get("title") or "Kodik",
        "quality": result.get("quality") or "auto",
        "episodes_count": positive_number(result.get("episodes_count")),
        "screenshots": [
            item
            for item in result.get("screenshots") or []
            if isinstance(item, str) and item.startswith("https://")
        ],
        "episode_titles": extract_episode_titles(result),
    }


def extract_translations(results: list[dict]) -> list[dict]:
    """Build the list of available dubbing teams from all Kodik search results.

    Each Kodik result is one (anime, translation) pair — collect them all,
    unique by translation id, keeping the player link per translation.
    """
    translations: list[dict] = []
    seen: set[str] = set()
    for result in results:
        translation = result.get("translation")
        if not isinstance(translation, dict):
            continue
        title = str(translation.get("title") or "").strip()
        if not title:
            continue
        tr_id = str(translation.get("id") or title)
        if tr_id in seen:
            continue
        link = absolute_link(result.get("link"))
        if not is_allowed_url(link):
            continue
        seen.add(tr_id)
        translations.append(
            {
                "id": tr_id,
                "title": title,
                "link": link,
                "episodes_count": positive_number(result.get("episodes_count")),
            }
        )
    return translations


def extract_episode_titles(result: dict) -> dict[str, str]:
    """Try to extract per-episode titles from a Kodik result.

    Kodik stores episodes under ``result["seasons"][season_key]["episodes"][ep_num]``.
    Each episode dict *may* have a ``"title"`` field — this is not always present.
    Returns a dict mapping episode number (as string) → title string.
    """
    titles: dict[str, str] = {}
    try:
        seasons: dict = result.get("seasons") or {}
        for season_data in seasons.values():
            if not isinstance(season_data, dict):
                continue
            episodes: dict = season_data.get("episodes") or {}
            for ep_num, ep_data in episodes.items():
                if isinstance(ep_data, dict):
                    title = ep_data.get("title")
                    if title and isinstance(title, str):
                        titles[str(ep_num)] = title.strip()
        # Some anime-type results have episodes at the top level (no seasons)
        top_episodes: dict = result.get("episodes") or {}
        if isinstance(top_episodes, dict):
            for ep_num, ep_data in top_episodes.items():
                if isinstance(ep_data, dict):
                    title = ep_data.get("title")
                    if title and isinstance(title, str) and str(ep_num) not in titles:
                        titles[str(ep_num)] = title.strip()
    except Exception:
        pass
    return titles
