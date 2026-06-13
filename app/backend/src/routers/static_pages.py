from fastapi import APIRouter, HTTPException

from src.config import get_settings
from src.db.static_pages import ALLOWED_STATIC_PAGE_SLUGS, get_static_page

router = APIRouter(prefix="/api/pages", tags=["pages"])


@router.get("/{slug}")
def public_static_page(slug: str) -> dict:
    if slug not in ALLOWED_STATIC_PAGE_SLUGS:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    page = get_static_page(get_settings().database_path, slug)
    if not page:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    return page
