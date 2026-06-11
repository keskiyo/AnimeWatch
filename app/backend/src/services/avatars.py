"""Avatar upload: validation, optimisation (256×256 WEBP), storage.

Files live in data/avatars/{user_id}.webp (a few KB each) and are served
publicly via GET /api/avatars/{user_id} — so comments can show them to
everyone without auth.
"""

import io
from pathlib import Path

from PIL import Image

from src.config import get_settings

AVATAR_SIZE = 256
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}


class AvatarError(Exception):
    pass


def avatars_dir() -> Path:
    base = Path(get_settings().database_path).resolve().parent / "avatars"
    base.mkdir(parents=True, exist_ok=True)
    return base


def avatar_path(user_id: int) -> Path:
    return avatars_dir() / f"{user_id}.webp"


def process_and_save_avatar(user_id: int, raw: bytes) -> str:
    """Validate, center-crop to a square, resize to 256px, save as WEBP.

    Returns the public URL (with a cache-busting version) for users.avatar_url.
    """
    if len(raw) > MAX_UPLOAD_BYTES:
        raise AvatarError("Файл больше 5 МБ")

    try:
        image = Image.open(io.BytesIO(raw))
        image_format = (image.format or "").upper()
        image.load()
    except Exception as exc:
        raise AvatarError("Файл не является изображением") from exc

    if image_format not in ALLOWED_FORMATS:
        raise AvatarError("Поддерживаются только JPEG, PNG, WEBP и GIF")

    # Animated GIFs: take the first frame
    image = image.convert("RGB")

    # Center-crop to a square, then downscale — output is ~5-20 KB
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    image = image.crop((left, top, left + side, top + side))
    if side > AVATAR_SIZE:
        image = image.resize((AVATAR_SIZE, AVATAR_SIZE), Image.LANCZOS)

    target = avatar_path(user_id)
    image.save(target, "WEBP", quality=82, method=6)

    version = int(target.stat().st_mtime)
    return f"/api/avatars/{user_id}?v={version}"
