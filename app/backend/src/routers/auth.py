"""Auth routes: register, login, me, logout, change-password, avatar."""

from fastapi import APIRouter, Header, HTTPException, UploadFile

from src.db.user.users import set_user_avatar
from src.schemas.requests import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
)
from src.services.user.auth import (
    AuthError,
    change_password,
    get_current_user,
    login_user,
    logout_user,
    register_user,
    update_profile,
)
from src.services.user.avatars import MAX_UPLOAD_BYTES, AvatarError, process_and_save_avatar

router = APIRouter(prefix="/api/auth", tags=["auth"])

_STATUS_BY_CODE = {
    "validation": 422,
    "email_taken": 409,
    "invalid_credentials": 401,
    "unauthorized": 401,
    "blocked": 403,
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
async def register(body: RegisterRequest) -> dict:
    try:
        return await register_user(body.name, body.email, body.password)
    except AuthError as error:
        _raise(error)
        raise


@router.post("/login")
async def login(body: LoginRequest) -> dict:
    try:
        return await login_user(body.login or body.email or "", body.password)
    except AuthError as error:
        _raise(error)
        raise


@router.get("/me")
async def me(authorization: str | None = Header(default=None)) -> dict:
    try:
        return await get_current_user(_bearer(authorization))
    except AuthError as error:
        _raise(error)
        raise


@router.post("/logout")
async def logout(authorization: str | None = Header(default=None)) -> dict:
    await logout_user(_bearer(authorization))
    return {"success": True}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile,
    authorization: str | None = Header(default=None),
) -> dict:
    try:
        user = await get_current_user(_bearer(authorization))
    except AuthError as error:
        _raise(error)
        raise

    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    try:
        avatar_url = process_and_save_avatar(user["id"], raw)
    except AvatarError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    await set_user_avatar(user["id"], avatar_url)
    return {"avatar_url": avatar_url}


@router.post("/change-password")
async def change_password_route(
    body: ChangePasswordRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    try:
        await change_password(
            _bearer(authorization), body.old_password, body.new_password
        )
        return {"success": True}
    except AuthError as error:
        _raise(error)
        raise


@router.patch("/profile")
async def update_profile_route(
    body: UpdateProfileRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    try:
        return await update_profile(_bearer(authorization), body.name)
    except AuthError as error:
        _raise(error)
        raise
