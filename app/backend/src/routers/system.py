"""System routes: health check and the Shikimori image proxy."""

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from src.config import get_settings
from src.logger import get_logger

log = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["system"])

# Domains we are willing to proxy images from (Shikimori hotlink protection bypass).
_ALLOWED_IMAGE_HOSTS = (
    "shikimori.one",
    "shikimori.org",
    "desu.shikimori.one",
    "nyaa.shikimori.one",
    "moe.shikimori.one",
)


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "runtime": "fastapi"}


@router.get("/image-proxy")
async def image_proxy(url: str) -> Response:
    """
    Proxy a Shikimori image server-side with a valid Referer/User-Agent.
    Shikimori blocks cross-origin hotlinking and serves a "404" placeholder;
    fetching from the backend (which presents itself as shikimori.one) bypasses that.
    """
    if not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Only https URLs are allowed")
    host = url.split("/", 3)[2].lower()
    if host not in _ALLOWED_IMAGE_HOSTS:
        raise HTTPException(status_code=400, detail="Host not allowed")

    env = get_settings()
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(
                url,
                headers={
                    "User-Agent": env.shikimori_user_agent,
                    "Referer": "https://shikimori.one/",
                    "Accept": "image/avif,image/webp,image/*,*/*",
                },
            )
            resp.raise_for_status()
    except Exception as exc:
        log.warning("image-proxy %s: %s", url, exc)
        raise HTTPException(status_code=502, detail="Image fetch failed") from exc

    return Response(
        content=resp.content,
        media_type=resp.headers.get("content-type", "image/jpeg"),
        headers={"Cache-Control": "public, max-age=604800"},
    )
