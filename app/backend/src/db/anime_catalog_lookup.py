"""Focused lookups over the permanent anime_catalog table."""

import re

from src.db.anime_catalog import connect, row_to_anime
from src.models import Anime

_STATUS_RANK_SQL = (
    "CASE status WHEN 'ongoing' THEN 0 WHEN 'released' THEN 1 ELSE 2 END"
)
# Hide titles confirmed to have no Kodik dubbing (see anime_catalog_queries)
_KODIK_VISIBLE = "(has_kodik IS NULL OR has_kodik != 0)"
_SEASON_MARKERS_RE = re.compile(
    r"\b(\d+(st|nd|rd|th)?\s*season|season\s*\d+|part\s*\d+)\b",
    re.IGNORECASE,
)
_RU_TRAILING_SEASON_RE = re.compile(r"\s+\d+\s*$")
_NON_WORD_RE = re.compile(r"[^\w]+", re.UNICODE)


def _family_key(anime: Anime) -> str:
    title = anime.get("title_en") or anime.get("title_ru") or ""
    title = title.replace("[", " ").replace("]", " ")
    title = _SEASON_MARKERS_RE.sub(" ", title)
    title = _RU_TRAILING_SEASON_RE.sub("", title)
    title = _NON_WORD_RE.sub(" ", title.lower())
    return " ".join(title.split())


def get_anime_catalog_by_ids(
    database_path: str,
    anime_ids: list[int],
) -> dict[int, Anime]:
    ids: list[int] = []
    for anime_id in anime_ids:
        try:
            value = int(anime_id)
        except (TypeError, ValueError):
            continue
        if value > 0 and value not in ids:
            ids.append(value)
    if not ids:
        return {}

    marks = ",".join("?" * len(ids))
    rows = connect(database_path).execute(
        f"SELECT * FROM anime_catalog WHERE id IN ({marks}) AND {_KODIK_VISIBLE}",
        ids,
    ).fetchall()
    return {int(row["id"]): row_to_anime(row) for row in rows}


def get_anime_catalog_by_studio(
    database_path: str,
    studio_name: str,
) -> list[Anime]:
    name = studio_name.strip()
    if not name:
        return []

    rows = connect(database_path).execute(
        f"""
        SELECT * FROM anime_catalog
        WHERE LOWER(studio) = LOWER(?) AND {_KODIK_VISIBLE}
        ORDER BY {_STATUS_RANK_SQL}, year DESC, rating DESC
        """,
        (name,),
    ).fetchall()
    return [row_to_anime(row) for row in rows]


def get_anime_catalog_title_family(
    database_path: str,
    anime_id: int,
) -> list[Anime]:
    """Return locally known titles from the same numbered/season family."""
    try:
        current_id = int(anime_id)
    except (TypeError, ValueError):
        return []

    rows = connect(database_path).execute(
        "SELECT * FROM anime_catalog "
        f"WHERE (title_en != '' OR title_ru != '') AND {_KODIK_VISIBLE}",
    ).fetchall()
    items = [row_to_anime(row) for row in rows]
    current = next((item for item in items if item["id"] == current_id), None)
    if not current:
        return []

    key = _family_key(current)
    if len(key) < 4:
        return []

    family = [
        item
        for item in items
        if item["id"] != current_id and _family_key(item) == key
    ]
    return sorted(
        family,
        key=lambda item: (
            item.get("year") or 9999,
            item.get("id") or 0,
        ),
    )


def get_upcoming_anime_from_catalog(
    database_path: str,
    limit_days: int,
) -> list[Anime]:
    rows = connect(database_path).execute(
        f"""
        SELECT * FROM anime_catalog
        WHERE next_episode_at IS NOT NULL AND next_episode_at != ''
          AND {_KODIK_VISIBLE}
        ORDER BY next_episode_at ASC
        LIMIT ?
        """,
        (max(limit_days, 1) * 50,),
    ).fetchall()
    return [row_to_anime(row) for row in rows]
