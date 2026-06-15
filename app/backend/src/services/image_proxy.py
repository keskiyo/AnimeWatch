"""Safe Shikimori image fetching and optional poster resizing."""

from __future__ import annotations

import io

import httpx
from fastapi import HTTPException
from PIL import Image

from src.config import Settings
from src.logger import get_logger

log = get_logger(__name__)

ALLOWED_IMAGE_HOSTS = (
    "shikimori.io",
    "shikimori.one",
    "shikimori.org",
    "desu.shikimori.one",
    "nyaa.shikimori.one",
    "moe.shikimori.one",
)
MAX_PROXY_WIDTH = 1200


async def fetch_proxied_image(
    url: str,
    width: int | None,
    env: Settings,
) -> tuple[bytes, str]:
    """Fetch an allowed image and return a resized WEBP when width is requested."""
    validate_image_url(url)
    content, media_type = await _fetch_remote_image(url, env)
    normalized_width = _normalize_width(width)
    if not normalized_width:
        return content, media_type

    resized = _resize_to_webp(content, normalized_width)
    if not resized:
        return content, media_type
    return resized, "image/webp"


def validate_image_url(url: str) -> None:
    if not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Only https URLs are allowed")
    host = url.split("/", 3)[2].lower()
    if host not in ALLOWED_IMAGE_HOSTS:
        raise HTTPException(status_code=400, detail="Host not allowed")


async def _fetch_remote_image(url: str, env: Settings) -> tuple[bytes, str]:
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=False) as client:
            resp = await client.get(
                url,
                headers={
                    "User-Agent": env.shikimori_user_agent,
                    "Referer": "https://shikimori.one/",
                    "Accept": "image/avif,image/webp,image/*,*/*",
                },
            )
            if resp.is_redirect:
                raise HTTPException(status_code=502, detail="Image redirect refused")
            resp.raise_for_status()
    except HTTPException:
        raise
    except Exception as exc:
        log.warning("[image-proxy] fetch %s: %s", url, exc)
        raise HTTPException(status_code=502, detail="Image fetch failed") from exc

    return resp.content, resp.headers.get("content-type", "image/jpeg")


def _normalize_width(width: int | None) -> int | None:
    if width is None:
        return None
    return max(64, min(width, MAX_PROXY_WIDTH))


def _resize_to_webp(content: bytes, width: int) -> bytes | None:
    try:
        image = Image.open(io.BytesIO(content))
        if image.width <= width:
            return None
        ratio = width / image.width
        height = max(1, int(image.height * ratio))
        image = image.convert("RGB").resize((width, height), Image.LANCZOS)
        output = io.BytesIO()
        image.save(output, format="WEBP", quality=82, method=4)
        return output.getvalue()
    except Exception as exc:
        log.warning("[image-proxy] resize failed: %s", exc)
        return None
