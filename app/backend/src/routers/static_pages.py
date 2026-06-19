from fastapi import APIRouter, HTTPException

from src.db.static_pages import ALLOWED_STATIC_PAGE_SLUGS, get_static_page

router = APIRouter(prefix="/api/pages", tags=["pages"])


@router.get("/{slug}")
async def public_static_page(slug: str) -> dict:
    if slug not in ALLOWED_STATIC_PAGE_SLUGS:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    page = await get_static_page(slug)
    if not page:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    return page
