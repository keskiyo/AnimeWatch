from fastapi import APIRouter, Depends

from src.config import get_settings
from src.db.admin_audit import list_admin_audit_logs
from src.routers.admin_auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/audit")
async def admin_audit_log(
    page: int = 1,
    limit: int = 30,
    _admin: dict = Depends(require_admin),
) -> dict[str, object]:
    return list_admin_audit_logs(get_settings().database_path, page, limit)
