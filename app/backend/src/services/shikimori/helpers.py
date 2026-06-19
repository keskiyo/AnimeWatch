"""Small pure helpers + the shared Mongo cache accessor."""

from datetime import UTC, datetime
from typing import Any
from urllib.parse import urljoin

from src.db.cache import CacheStore, get_cache as _get_cache


def get_cache(*_args) -> CacheStore:
    """Return the shared Mongo CacheStore (any arg is ignored, kept for callers)."""
    return _get_cache()


def split_param(value: str | None) -> list[str]:
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


def season_param_range(
    year_from: int | None,
    year_to: int | None,
    season: str | None,
) -> str | None:
    year = year_from
    if not year or not (1900 <= year <= 2100):
        return None
    return f"{season}_{year}" if season else str(year)


def positive_int(value: str | None, fallback: int) -> int:
    try:
        parsed = int(value or "")
    except ValueError:
        return fallback
    return parsed if parsed > 0 else fallback


def optional_int(value: str | None) -> int | None:
    try:
        return int(value or "")
    except ValueError:
        return None


def default_status_for_sort(sort: str | None) -> str | None:
    return "ongoing,released" if sort in ("novelty", "startDate") else None


def first_text(values: Any) -> str | None:
    if not isinstance(values, list):
        return None
    return next(
        (value.strip() for value in values if isinstance(value, str) and value.strip()),
        None,
    )


def first_text_or(value: Any) -> str | None:
    """Accept either a list (REST) or a string (GQL)."""
    if isinstance(value, str):
        return value.strip() or None
    return first_text(value)


def absolute_url(value: Any, endpoint: str) -> str:
    return urljoin(endpoint, value) if isinstance(value, str) and value else ""


def to_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


def to_iso(value: Any, fallback: str) -> str:
    try:
        date = (
            datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            if value
            else datetime.fromisoformat(fallback)
        )
    except ValueError:
        date = datetime.fromisoformat(fallback)
    return date.astimezone(UTC).isoformat().replace("+00:00", "Z")


def year_of(value: Any) -> int | None:
    return int(value[:4]) if isinstance(value, str) and value[:4].isdigit() else None


def season_of(value: Any) -> str | None:
    if not isinstance(value, str) or len(value) < 7:
        return None
    month = int(value[5:7])
    if 3 <= month <= 5:
        return "spring"
    if 6 <= month <= 8:
        return "summer"
    if 9 <= month <= 11:
        return "fall"
    return "winter"
