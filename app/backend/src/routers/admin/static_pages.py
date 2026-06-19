from fastapi import APIRouter, Depends, HTTPException

from src.db.admin.audit import add_admin_audit_log
from src.db.static_pages import (
    ALLOWED_STATIC_PAGE_SLUGS,
    list_static_pages,
    update_static_page,
)
from src.routers.admin.auth import require_admin
from src.schemas.requests import StaticPageUpdateRequest

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/pages")
async def admin_static_pages(_admin: dict = Depends(require_admin)) -> dict:
    return {"data": await list_static_pages()}


@router.patch("/pages/{slug}")
async def admin_update_static_page(
    slug: str,
    body: StaticPageUpdateRequest,
    admin: dict = Depends(require_admin),
) -> dict:
    if slug not in ALLOWED_STATIC_PAGE_SLUGS:
        raise HTTPException(status_code=404, detail="Page was not found")
    page = await update_static_page(slug, body.title, body.content, admin["id"])
    await add_admin_audit_log(admin["id"], "page.updated", "page", slug)
    return page or {}
