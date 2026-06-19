from fastapi import APIRouter, Depends, HTTPException

from src.db.admin.audit import add_admin_audit_log
from src.db.admin.users import set_admin_user_blocked, set_admin_user_role
from src.db.user.users import get_user_by_id
from src.routers.admin.auth import require_admin
from src.schemas.requests import AdminBlockedRequest, AdminRoleRequest

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.patch("/users/{user_id}/role")
async def admin_set_user_role(
    user_id: str,
    body: AdminRoleRequest,
    admin: dict = Depends(require_admin),
) -> dict:
    if user_id == admin["id"] and body.role != "admin":
        raise HTTPException(status_code=400, detail="Admin cannot remove their own admin role")
    await _ensure_target_exists(user_id)
    updated = await set_admin_user_role(user_id, body.role)
    await add_admin_audit_log(admin["id"], "user.role_changed", "user", str(user_id))
    return updated or {}


@router.patch("/users/{user_id}/block")
async def admin_set_user_blocked(
    user_id: str,
    body: AdminBlockedRequest,
    admin: dict = Depends(require_admin),
) -> dict:
    if user_id == admin["id"] and body.is_blocked:
        raise HTTPException(status_code=400, detail="Admin cannot block themselves")
    await _ensure_target_exists(user_id)
    updated = await set_admin_user_blocked(user_id, body.is_blocked)
    action = "user.blocked" if body.is_blocked else "user.unblocked"
    await add_admin_audit_log(admin["id"], action, "user", str(user_id))
    return updated or {}


async def _ensure_target_exists(user_id: str) -> None:
    if not await get_user_by_id(user_id):
        raise HTTPException(status_code=404, detail="User was not found")
