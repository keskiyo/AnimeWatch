"""SEO routes served at the site root: sitemap.xml."""

from fastapi import APIRouter, Request, Response

from src.config import get_settings
from src.db.anime_catalog_queries import get_sitemap_rows
from src.services.seo import build_sitemap

router = APIRouter(tags=["seo"])


@router.get("/sitemap.xml")
async def sitemap(request: Request) -> Response:
    """All canonical URLs (static pages + every catalog title) for crawlers."""
    env = get_settings()
    base = (env.site_url or str(request.base_url)).rstrip("/")
    rows = await get_sitemap_rows()
    xml = build_sitemap(base, rows)
    return Response(content=xml, media_type="application/xml")
