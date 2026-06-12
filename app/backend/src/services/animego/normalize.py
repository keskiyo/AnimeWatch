"""Normalize raw AnimeGO payloads into the site player contract."""

from typing import Any


def unavailable_animego(message: str) -> dict:
    return {"available": False, "provider": "animego", "message": message}


def normalize_voices(raw: dict[str, Any]) -> dict:
    """get_voices payload → our player shape.

    Keeps only aniboom/cvh entries — Kodik comes through our own integration,
    and unknown player types can't be played by our <VideoPlayer>.
    """
    voices: list[dict] = []
    for item in raw.get("voices") or []:
        if not isinstance(item, dict):
            continue
        player_type = str(item.get("player") or "").lower()
        title = str(item.get("label") or "").strip()
        if player_type not in ("aniboom", "cvh") or not title:
            continue

        if player_type == "cvh":
            stream_ref = str(item.get("cvh_id") or "")
        else:
            stream_ref = str(item.get("translation_id") or "")
        if not stream_ref:
            continue

        voices.append(
            {
                "id": stream_ref,
                "title": title,
                "player_type": player_type,
                "stream_ref": stream_ref,
            }
        )

    if not voices:
        return unavailable_animego("Озвучки AnimeGO не найдены")

    # CVH first: it serves HLS reliably, while aniboom is often MPD-only
    # (which our player intentionally does not support)
    voices.sort(key=lambda v: 0 if v["player_type"] == "cvh" else 1)

    total = raw.get("total_episodes")
    return {
        "available": True,
        "provider": "animego",
        "episodes_count": int(total) if isinstance(total, int) and total > 0 else 0,
        "voices": voices,
    }


def normalize_aniboom_stream(raw: dict[str, Any]) -> dict:
    """aniboom_get_stream_for_voice → StreamSource. MPD is unsupported (no dash.js)."""
    url = str(raw.get("url") or "")
    if url.endswith(".m3u8") or ".m3u8" in url:
        return {"kind": "hls", "url": url}
    return {"kind": "unsupported"}


def normalize_cvh_stream(raw: dict[str, Any]) -> dict:
    """cvh_get_stream_by_id → StreamSource (HLS preferred, MP4 fallback)."""
    hls = raw.get("HLS")
    if isinstance(hls, str) and hls:
        return {"kind": "hls", "url": hls}
    mp4s = [u for u in raw.get("MP4s") or [] if isinstance(u, str) and u]
    if mp4s:
        # Best quality first (urls usually end with "<height>p.mp4")
        return {"kind": "mp4", "urls": sorted(mp4s, reverse=True)}
    return {"kind": "unsupported"}


def find_cvh_vk_id(playlist: dict, episode: int) -> str | None:
    """Locate vkId for the episode in a CVH playlist (grouped by season)."""
    seasons = [v for v in playlist.values() if isinstance(v, dict)]
    if not seasons:
        return None
    # Single-season titles: take the only season; otherwise prefer season 1
    season = seasons[0] if len(seasons) == 1 else _season_one(playlist) or seasons[0]
    for key, entries in season.items():
        if str(key) != str(episode) or not isinstance(entries, list):
            continue
        for entry in entries:
            if isinstance(entry, dict) and entry.get("vkId"):
                return str(entry["vkId"])
    return None


def _season_one(playlist: dict) -> dict | None:
    for key, value in playlist.items():
        if str(key) == "1" and isinstance(value, dict):
            return value
    return None
