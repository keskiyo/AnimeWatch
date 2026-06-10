"""Convert raw Shikimori GQL/REST payloads into the app's Anime shape."""

from datetime import UTC, datetime
from typing import Any

from src.models import Anime
from src.services.shikimori.constants import (
    GQL_STATUS_TO_APP,
    KIND_TO_TYPE,
    STATUS_TO_APP,
)
from src.services.shikimori.helpers import (
    absolute_url,
    first_text,
    first_text_or,
    season_of,
    to_float,
    to_iso,
    year_of,
)


def normalize_shikimori_gql_anime(
    raw: dict[str, Any],
    now_iso: str | None = None,
) -> Anime:
    """Normalize a single anime object from a GQL response."""
    now = now_iso or datetime.now(tz=UTC).isoformat()
    aired_on = (raw.get("airedOn") or {}).get("date")
    poster = raw.get("poster") or {}

    # GQL poster URLs are absolute (shikimori.io CDN) — no need to prepend endpoint
    poster_url = (
        poster.get("originalUrl")
        or poster.get("mainUrl")
        or poster.get("previewUrl")
        or ""
    )

    # Genres: include genre + demographic + theme kinds
    genres: list[str] = []
    for g in raw.get("genres") or []:
        name = (g.get("russian") or g.get("name") or "").strip()
        if name and name not in genres:
            genres.append(name)

    studios = raw.get("studios") or []
    studio_name = str(studios[0].get("name") or "") if studios else ""

    score_count = sum(int(s.get("count") or 0) for s in (raw.get("scoresStats") or []))

    anime: Anime = {
        "id": int(raw["id"]),
        "title_ru": (raw.get("russian") or raw.get("name") or "").strip(),
        "title_en": first_text_or(raw.get("name")) or "",
        "title_jp": first_text_or(raw.get("japanese"))
        or first_text_or(raw.get("name"))
        or "",
        "poster_url": poster_url,
        "description": (raw.get("description") or "").strip(),
        "genres": genres,
        "studio": studio_name,
        "type": KIND_TO_TYPE.get(str(raw.get("kind") or ""), "tv"),
        "status": GQL_STATUS_TO_APP.get(str(raw.get("status") or ""), "released"),
        "year": year_of(aired_on)
        or datetime.fromisoformat(now.replace("Z", "+00:00")).year,
        "episodes_total": int(raw.get("episodes") or 0),
        "episodes_aired": int(raw.get("episodesAired") or 0),
        "rating": to_float(raw.get("score")),
        "score_count": score_count,
        "url_shikimori": raw.get("url") or "",
        "updated_at": now,
    }

    season = season_of(aired_on)
    if season:
        anime["season"] = season
    if raw.get("nextEpisodeAt"):
        anime["next_episode_at"] = str(raw["nextEpisodeAt"])  # type: ignore[typeddict-unknown-key]
    if raw.get("rating"):
        anime["rating_mpaa"] = str(raw["rating"])  # type: ignore[typeddict-unknown-key]
    if raw.get("duration"):
        try:
            d = int(raw["duration"])
            if d > 0:
                anime["duration"] = d  # type: ignore[typeddict-unknown-key]
        except (ValueError, TypeError):
            pass

    return anime


def normalize_shikimori_anime(
    raw: dict[str, Any], endpoint: str, now_iso: str | None = None
) -> Anime:
    """Normalize a REST list/detail response (fallback, used by catalog endpoint)."""
    now = now_iso or datetime.now(tz=UTC).isoformat()
    aired_on = raw.get("aired_on") or raw.get("released_on")
    title_en = first_text(raw.get("english")) or str(raw.get("name") or "")

    image = raw.get("image") or {}
    image_original = image.get("original") or ""
    # If REST gives a missing placeholder, use empty — frontend shows its own fallback
    if "missing" in image_original or not image_original:
        poster_url = ""
    else:
        poster_url = absolute_url(image_original, endpoint)

    anime: Anime = {
        "id": int(raw["id"]),
        "title_ru": (raw.get("russian") or raw.get("name") or "").strip(),
        "title_en": title_en,
        "title_jp": first_text(raw.get("japanese")) or str(raw.get("name") or ""),
        "poster_url": poster_url,
        "description": (raw.get("description") or "").strip(),
        "genres": [
            genre.get("russian") or genre.get("name")
            for genre in raw.get("genres") or []
            if genre.get("russian") or genre.get("name")
        ],
        "studio": str((raw.get("studios") or [{}])[0].get("name") or ""),
        "type": KIND_TO_TYPE.get(raw.get("kind"), "tv"),
        "status": STATUS_TO_APP.get(raw.get("status"), "released"),
        "year": year_of(aired_on)
        or datetime.fromisoformat(now.replace("Z", "+00:00")).year,
        "episodes_total": int(raw.get("episodes") or 0),
        "episodes_aired": int(raw.get("episodes_aired") or 0),
        "rating": to_float(raw.get("score")),
        "score_count": sum(
            int(item.get("value") or 0) for item in raw.get("rates_scores_stats") or []
        ),
        "url_shikimori": absolute_url(raw.get("url"), endpoint),
        "updated_at": to_iso(raw.get("updated_at"), now),
    }

    season = season_of(aired_on)
    if season:
        anime["season"] = season
    if raw.get("myanimelist_id"):
        anime["mal_id"] = int(raw["myanimelist_id"])
    if raw.get("next_episode_at"):
        anime["next_episode_at"] = str(raw["next_episode_at"])  # type: ignore[typeddict-unknown-key]
    if raw.get("rating"):
        anime["rating_mpaa"] = str(raw["rating"])  # type: ignore[typeddict-unknown-key]
    if raw.get("duration"):
        try:
            anime["duration"] = int(raw["duration"])  # type: ignore[typeddict-unknown-key]
        except (ValueError, TypeError):
            pass
    if raw.get("source"):
        anime["source"] = str(raw["source"])  # type: ignore[typeddict-unknown-key]

    return anime


def merge_roles(anime: Anime, raw_roles: Any, endpoint: str) -> None:
    """Fill directors/authors/main characters from the REST roles payload."""
    if not isinstance(raw_roles, list):
        return

    directors: list[dict] = []
    authors: list[dict] = []
    characters: list[dict] = []

    for entry in raw_roles:
        roles: list[str] = entry.get("roles") or []
        person = entry.get("person")
        character = entry.get("character")

        if person and isinstance(person, dict):
            name = (person.get("russian") or person.get("name") or "").strip()
            url = absolute_url(person.get("url"), endpoint)
            if name:
                obj = {"name": name, "url": url}
                if any(r in roles for r in ("Director", "Series Director")):
                    if obj not in directors:
                        directors.append(obj)
                elif any(
                    r in roles
                    for r in (
                        "Original Creator",
                        "Original Manga Creator",
                        "Author",
                        "Story",
                        "Original Story",
                    )
                ):
                    if obj not in authors:
                        authors.append(obj)

        if character and isinstance(character, dict) and len(characters) < 6:
            if "Main" in roles:
                name = (character.get("russian") or character.get("name") or "").strip()
                url = absolute_url(character.get("url"), endpoint)
                if name:
                    obj = {"name": name, "url": url}
                    if obj not in characters:
                        characters.append(obj)

    if directors:
        anime["directors"] = directors  # type: ignore[typeddict-unknown-key]
    if authors:
        anime["authors"] = authors  # type: ignore[typeddict-unknown-key]
    if characters:
        anime["characters"] = characters  # type: ignore[typeddict-unknown-key]


def merge_screenshots(anime: Anime, raw_screenshots: Any, endpoint: str) -> None:
    if not isinstance(raw_screenshots, list):
        return
    urls: list[str] = []
    for item in raw_screenshots:
        if not isinstance(item, dict):
            continue
        url = item.get("original") or item.get("preview")
        if url:
            abs_url = absolute_url(url, endpoint)
            if abs_url and abs_url not in urls:
                urls.append(abs_url)
    if urls:
        anime["screenshots"] = urls  # type: ignore[typeddict-unknown-key]


def normalize_related(raw: Any, endpoint: str) -> list[dict]:
    if not isinstance(raw, list):
        return []
    result: list[dict] = []
    for entry in raw:
        anime_raw = entry.get("anime")
        if not anime_raw or not isinstance(anime_raw, dict):
            continue
        anime_id = anime_raw.get("id")
        if not anime_id:
            continue

        image = anime_raw.get("image") or {}
        image_original = image.get("original") or ""
        if "missing" in image_original or not image_original:
            poster_url = ""
        else:
            poster_url = absolute_url(image_original, endpoint)

        result.append(
            {
                "id": int(anime_id),
                "relation": entry.get("relation_russian")
                or entry.get("relation")
                or "",
                "title_ru": (
                    anime_raw.get("russian") or anime_raw.get("name") or ""
                ).strip(),
                "title_en": first_text(anime_raw.get("english"))
                or str(anime_raw.get("name") or ""),
                "poster_url": poster_url,
                "type": KIND_TO_TYPE.get(anime_raw.get("kind"), "tv"),
                "year": year_of(anime_raw.get("aired_on")) or 0,
                "rating": to_float(anime_raw.get("score")),
            }
        )
    return result
