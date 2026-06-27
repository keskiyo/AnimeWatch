"""SEO routes served at the site root: sitemap.xml + robots.txt."""

from fastapi import APIRouter, Request, Response
from fastapi.responses import PlainTextResponse

from src.config import get_settings
from src.db.anime_catalog_queries import (
    get_distinct_genres,
    get_distinct_studios,
    get_sitemap_rows,
)
from src.services.seo import build_sitemap

router = APIRouter(tags=["seo"])


def _base(request: Request) -> str:
    return (get_settings().site_url or str(request.base_url)).rstrip("/")


@router.get("/sitemap.xml")
async def sitemap(request: Request) -> Response:
    """All canonical URLs (static + genres + studios + every title) for crawlers."""
    rows = await get_sitemap_rows()
    studios = await get_distinct_studios()
    genres = await get_distinct_genres()
    xml = build_sitemap(_base(request), rows, studios=studios, genres=genres)
    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt")
async def robots(request: Request) -> PlainTextResponse:
    """Robots policy with an absolute Sitemap URL derived from SITE_URL/host."""
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin\n"
        "Disallow: /profile\n"
        "Disallow: /*?\n"  # filter/sort query variants — canonical pages only
        f"\nSitemap: {_base(request)}/sitemap.xml\n"
    )
    return PlainTextResponse(body)
