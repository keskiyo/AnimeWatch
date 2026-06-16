from fastapi import Header, HTTPException

from src.services.user.auth import AuthError, get_current_user


def _bearer(authorization: str | None) -> str | None:
    if authorization and authorization.startswith("Bearer "):
        return authorization.removeprefix("Bearer ").strip()
    return None


def require_admin(authorization: str | None = Header(default=None)) -> dict:
    try:
        user = get_current_user(_bearer(authorization))
    except AuthError as error:
        raise HTTPException(
            status_code=401,
            detail={"code": error.code, "message": error.message},
        ) from error

    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={"code": "forbidden", "message": "Недостаточно прав"},
        )
    return user
