from fastapi import APIRouter, Depends, HTTPException

from src.config import get_settings
from src.db.admin_audit import add_admin_audit_log
from src.db.static_pages import (
    ALLOWED_STATIC_PAGE_SLUGS,
    list_static_pages,
    update_static_page,
)
from src.routers.admin_auth import require_admin
from src.schemas.requests import StaticPageUpdateRequest

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/pages")
def admin_static_pages(_admin: dict = Depends(require_admin)) -> dict:
    return {"data": list_static_pages(get_settings().database_path)}


@router.patch("/pages/{slug}")
def admin_update_static_page(
    slug: str,
    body: StaticPageUpdateRequest,
    admin: dict = Depends(require_admin),
) -> dict:
    if slug not in ALLOWED_STATIC_PAGE_SLUGS:
        raise HTTPException(status_code=404, detail="Page was not found")
    db = get_settings().database_path
    page = update_static_page(db, slug, body.title, body.content, int(admin["id"]))
    add_admin_audit_log(db, int(admin["id"]), "page.updated", "page", slug)
    return page or {}
