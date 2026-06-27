"""SEO helpers: canonical anime slug + sitemap XML builder.

`anime_slug` mirrors the frontend `createAnimeSlug` exactly so sitemap URLs
match the canonical paths the SPA redirects to (one URL per title).
"""

import re
import unicodedata
from urllib.parse import quote
from xml.sax.saxutils import escape

_STATIC_PATHS = ("/", "/anime", "/ongoing", "/agreement", "/privacy", "/copyright")

# Cyrillic → Latin. MUST stay identical to frontend utils/animeSlug.ts CYRILLIC.
_CYRILLIC = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def _transliterate(text: str) -> str:
    return "".join(_CYRILLIC.get(ch, ch) for ch in text.lower())


def _kebab(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", _transliterate(text or ""))
    normalized = "".join(c for c in normalized if not unicodedata.combining(c))
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized.lower())
    return re.sub(r"-{2,}", "-", normalized).strip("-")


def anime_slug(anime_id: int, title: str) -> str:
    return f"{anime_id}-{_kebab(title) or 'anime'}"


def genre_slug(name: str) -> str:
    """URL slug for a genre landing page (`/anime/zhanr/<slug>`)."""
    return _kebab(name) or "anime"


def build_sitemap(
    base_url: str,
    rows: list[dict],
    studios: list[str] | None = None,
    genres: list[str] | None = None,
) -> str:
    base = base_url.rstrip("/")
    entries: list[str] = []
    for path in _STATIC_PATHS:
        entries.append(_url(f"{base}{path}", None))
    for genre in genres or []:
        entries.append(_url(f"{base}/anime/zhanr/{genre_slug(genre)}", None))
    for studio in studios or []:
        entries.append(_url(f"{base}/studio/{quote(studio)}", None))
    for row in rows:
        loc = f"{base}/anime/{anime_slug(int(row['id']), row.get('title') or '')}"
        entries.append(_url(loc, _lastmod(row.get("updated_at"))))

    body = "\n".join(entries)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{body}\n"
        "</urlset>\n"
    )


def _url(loc: str, lastmod: str | None) -> str:
    parts = [f"  <url><loc>{escape(loc)}</loc>"]
    if lastmod:
        parts.append(f"<lastmod>{lastmod}</lastmod>")
    parts.append("</url>")
    return "".join(parts)


def _lastmod(updated_at: str | None) -> str | None:
    """Take the YYYY-MM-DD part of an ISO timestamp, if it looks like one."""
    if updated_at and re.match(r"^\d{4}-\d{2}-\d{2}", updated_at):
        return updated_at[:10]
    return None
