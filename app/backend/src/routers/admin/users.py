from fastapi import APIRouter, Depends, HTTPException

from src.config import get_settings
from src.db.admin.audit import add_admin_audit_log
from src.db.admin.users import list_admin_users
from src.db.user.users import get_user_by_id, set_user_password
from src.routers.admin.auth import require_admin
from src.schemas.requests import AdminPasswordResetRequest

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users")
def admin_users(
    search: str = "",
    role: str = "",
    blocked: str = "",
    page: int = 1,
    limit: int = 30,
    _admin: dict = Depends(require_admin),
) -> dict:
    db = get_settings().database_path
    return list_admin_users(
        db,
        search=search,
        role=role,
        blocked=blocked,
        page=page,
        limit=limit,
    )


@router.post("/users/{user_id}/password")
def admin_reset_user_password(
    user_id: int,
    body: AdminPasswordResetRequest,
    admin: dict = Depends(require_admin),
) -> dict:
    db = get_settings().database_path
    if not get_user_by_id(db, user_id):
        raise HTTPException(status_code=404, detail="User was not found")

    set_user_password(db, user_id, body.password)
    add_admin_audit_log(
        db,
        int(admin["id"]),
        "user.password_reset",
        "user",
        str(user_id),
    )
    return {"success": True}
