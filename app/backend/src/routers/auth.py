"""Auth routes: register, login, me, logout, change-password, avatar."""

from fastapi import APIRouter, Body, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse

from src.config import get_settings
from src.db.users import set_user_avatar
from src.services.auth import (
    AuthError,
    change_password,
    get_current_user,
    login_user,
    logout_user,
    register_user,
    update_profile,
)
from src.services.avatars import (
    MAX_UPLOAD_BYTES,
    AvatarError,
    avatar_path,
    process_and_save_avatar,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

_STATUS_BY_CODE = {
    "validation": 422,
    "email_taken": 409,
    "invalid_credentials": 401,
    "unauthorized": 401,
}


def _bearer(authorization: str | None) -> str | None:
    if authorization and authorization.startswith("Bearer "):
        return authorization.removeprefix("Bearer ").strip()
    return None


def _raise(error: AuthError) -> None:
    raise HTTPException(
        status_code=_STATUS_BY_CODE.get(error.code, 400),
        detail={"code": error.code, "message": error.message},
    )


@router.post("/register", status_code=201)
def register(body: dict = Body(...)) -> dict:
    try:
        return register_user(
            str(body.get("name") or ""),
            str(body.get("email") or ""),
            str(body.get("password") or ""),
        )
    except AuthError as error:
        _raise(error)
        raise  # unreachable — keeps the type checker happy


@router.post("/login")
def login(body: dict = Body(...)) -> dict:
    try:
        return login_user(
            str(body.get("login") or body.get("email") or ""),
            str(body.get("password") or ""),
        )
    except AuthError as error:
        _raise(error)
        raise


@router.get("/me")
def me(authorization: str | None = Header(default=None)) -> dict:
    try:
        return get_current_user(_bearer(authorization))
    except AuthError as error:
        _raise(error)
        raise


@router.post("/logout")
def logout(authorization: str | None = Header(default=None)) -> dict:
    logout_user(_bearer(authorization))
    return {"success": True}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile,
    authorization: str | None = Header(default=None),
) -> dict:
    """Upload the current user's avatar (optimised to 256×256 WEBP, ~10 KB)."""
    try:
        user = get_current_user(_bearer(authorization))
    except AuthError as error:
        _raise(error)
        raise

    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    try:
        avatar_url = process_and_save_avatar(user["id"], raw)
    except AvatarError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    set_user_avatar(get_settings().database_path, user["id"], avatar_url)
    return {"avatar_url": avatar_url}


@router.post("/change-password")
def change_password_route(
    body: dict = Body(...),
    authorization: str | None = Header(default=None),
) -> dict:
    try:
        change_password(
            _bearer(authorization),
            str(body.get("old_password") or ""),
            str(body.get("new_password") or ""),
        )
        return {"success": True}
    except AuthError as error:
        _raise(error)
        raise


@router.patch("/profile")
def update_profile_route(
    body: dict = Body(...),
    authorization: str | None = Header(default=None),
) -> dict:
    try:
        return update_profile(_bearer(authorization), str(body.get("name") or ""))
    except AuthError as error:
        _raise(error)
        raise
