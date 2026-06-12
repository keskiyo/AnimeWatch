from fastapi import APIRouter, Body, Depends, HTTPException

from src.config import get_settings
from src.db.admin_audit import add_admin_audit_log
from src.db.admin_users import list_admin_users
from src.db.users import ensure_users_schema, get_user_by_id, set_user_password
from src.routers.admin_auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users")
def admin_users(
    search: str = "",
    page: int = 1,
    limit: int = 30,
    _admin: dict = Depends(require_admin),
) -> dict:
    db = get_settings().database_path
    ensure_users_schema(db)
    return list_admin_users(db, search=search, page=page, limit=limit)


@router.post("/users/{user_id}/password")
def admin_reset_user_password(
    user_id: int,
    body: dict = Body(...),
    admin: dict = Depends(require_admin),
) -> dict:
    password = str(body.get("password") or "")
    if len(password) < 8 or len(password) > 128 or not password.strip():
        raise HTTPException(status_code=422, detail="Пароль должен быть от 8 до 128 символов")

    db = get_settings().database_path
    ensure_users_schema(db)
    if not get_user_by_id(db, user_id):
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    set_user_password(db, user_id, password)
    add_admin_audit_log(
        db,
        int(admin["id"]),
        "user.password_reset",
        "user",
        str(user_id),
    )
    return {"success": True}
