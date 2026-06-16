from fastapi import APIRouter, Depends, HTTPException

from src.config import get_settings
from src.db.admin.audit import add_admin_audit_log
from src.db.admin.comments import list_admin_comments
from src.db.user.comments import delete_comment, get_comment
from src.routers.admin.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/comments")
async def admin_comments(
    page: int = 1,
    limit: int = 30,
    _admin: dict = Depends(require_admin),
) -> dict[str, object]:
    return list_admin_comments(get_settings().database_path, page, limit)


@router.delete("/comments/{comment_id}")
async def admin_delete_comment(
    comment_id: int,
    admin: dict = Depends(require_admin),
) -> dict:
    db = get_settings().database_path
    comment = get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment was not found")
    delete_comment(db, comment_id)  # recursive: removes the whole reply subtree
    add_admin_audit_log(
        db, int(admin["id"]), "comment.deleted", "comment", str(comment_id)
    )
    return {"success": True}
