"""System routes: health check, public users and image proxy."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, Response

from src.config import get_settings
from src.db.user.users import get_user_by_id
from src.services.user.avatars import avatar_path
from src.services.image_proxy import fetch_proxied_image

router = APIRouter(prefix="/api", tags=["system"])

@router.get("/health")
def health() -> dict:
    return {"status": "ok", "runtime": "fastapi"}


@router.get("/users/{user_id}")
async def public_user_profile(user_id: str) -> dict:
    """Public profile (no email): name, avatar, role, registration date."""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.pop("email", None)
    return user


@router.get("/avatars/{user_id}")
def user_avatar(user_id: str) -> FileResponse:
    """Public avatar image (everyone sees it, e.g. next to comments)."""
    path = avatar_path(user_id)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Avatar not found")
    return FileResponse(
        path,
        media_type="image/webp",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/image-proxy")
async def image_proxy(url: str, w: int | None = None) -> Response:
    """
    Proxy a Shikimori image server-side with a valid Referer/User-Agent.
    Shikimori blocks cross-origin hotlinking and serves a "404" placeholder;
    fetching from the backend (which presents itself as shikimori.one) bypasses that.
    """
    env = get_settings()
    content, media_type = await fetch_proxied_image(url, w, env)

    return Response(
        content=content,
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=604800"},
    )
