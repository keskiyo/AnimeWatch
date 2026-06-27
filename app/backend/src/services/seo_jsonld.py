"""schema.org JSON-LD builders (server-side, mirror the client structuredData.ts).

Emitted in the server-rendered <head> so bots that don't run JS still get rich
structured data (anime work, breadcrumbs, site search box, organization).
"""

from src.models import Anime

SITE_NAME = "AnimeWatch"


def website_jsonld(base: str) -> dict:
    """WebSite + sitelinks search box + Organization (home page)."""
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "name": SITE_NAME,
                "url": f"{base}/",
                "inLanguage": "ru",
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": f"{base}/anime?search={{search_term_string}}",
                    },
                    "query-input": "required name=search_term_string",
                },
            },
            {
                "@type": "Organization",
                "name": SITE_NAME,
                "url": f"{base}/",
                "logo": f"{base}/AnimeWatch.png",
            },
        ],
    }


def collection_jsonld(name: str, url: str) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": name,
        "url": url,
        "inLanguage": "ru",
        "isPartOf": {"@type": "WebSite", "name": SITE_NAME},
    }


def anime_jsonld(anime: Anime, canonical_url: str, image: str, base: str) -> dict:
    """Work (TVSeries/Movie) + AggregateRating + BreadcrumbList for a detail page."""
    name = anime.get("title_ru") or anime.get("title_en") or "Аниме"
    work: dict = {
        "@type": "Movie" if anime.get("type") == "movie" else "TVSeries",
        "name": name,
        "url": canonical_url,
        "inLanguage": "ru",
    }
    if anime.get("title_en") and anime["title_en"] != name:
        work["alternateName"] = anime["title_en"]
    if image:
        work["image"] = image
    if anime.get("description"):
        work["description"] = str(anime["description"])[:500]
    if anime.get("year"):
        work["datePublished"] = str(anime["year"])
    if anime.get("genres"):
        work["genre"] = anime["genres"]
    if (anime.get("rating") or 0) > 0 and (anime.get("score_count") or 0) > 0:
        work["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": anime["rating"],
            "ratingCount": anime["score_count"],
            "bestRating": 10,
            "worstRating": 1,
        }
    return {
        "@context": "https://schema.org",
        "@graph": [
            work,
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Главная",
                     "item": f"{base}/"},
                    {"@type": "ListItem", "position": 2, "name": "Каталог",
                     "item": f"{base}/anime"},
                    {"@type": "ListItem", "position": 3, "name": name,
                     "item": canonical_url},
                ],
            },
        ],
    }
