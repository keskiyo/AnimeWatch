from fastapi import APIRouter, Depends, HTTPException

from src.config import get_settings
from src.db.admin_audit import add_admin_audit_log
from src.db.admin_users import set_admin_user_blocked, set_admin_user_role
from src.db.users import get_user_by_id
from src.routers.admin_auth import require_admin
from src.schemas.requests import AdminBlockedRequest, AdminRoleRequest

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.patch("/users/{user_id}/role")
def admin_set_user_role(
    user_id: int,
    body: AdminRoleRequest,
    admin: dict = Depends(require_admin),
) -> dict:
    if user_id == int(admin["id"]) and body.role != "admin":
        raise HTTPException(status_code=400, detail="Admin cannot remove their own admin role")
    db = get_settings().database_path
    _ensure_target_exists(db, user_id)
    updated = set_admin_user_role(db, user_id, body.role)
    add_admin_audit_log(db, int(admin["id"]), "user.role_changed", "user", str(user_id))
    return updated or {}


@router.patch("/users/{user_id}/block")
def admin_set_user_blocked(
    user_id: int,
    body: AdminBlockedRequest,
    admin: dict = Depends(require_admin),
) -> dict:
    if user_id == int(admin["id"]) and body.is_blocked:
        raise HTTPException(status_code=400, detail="Admin cannot block themselves")
    db = get_settings().database_path
    _ensure_target_exists(db, user_id)
    updated = set_admin_user_blocked(db, user_id, body.is_blocked)
    action = "user.blocked" if body.is_blocked else "user.unblocked"
    add_admin_audit_log(db, int(admin["id"]), action, "user", str(user_id))
    return updated or {}


def _ensure_target_exists(database_path: str, user_id: int) -> None:
    if not get_user_by_id(database_path, user_id):
        raise HTTPException(status_code=404, detail="User was not found")
