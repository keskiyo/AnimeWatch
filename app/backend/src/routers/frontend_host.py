"""Serve the built SPA with server-side SEO injection.

For every HTML document request this reads the built `index.html`, injects a
fully-formed <head> (title, meta, canonical, OG/Twitter, JSON-LD) and a crawlable
<body> from Mongo — so bots that don't run JS (Yandex, Bing, social scrapers)
get a complete page. The React app replaces #root on load for real users.

Static asset requests are served from the dist directory. Mounted LAST so it
never shadows /api, /admin, /internal, /sitemap.xml, /robots.txt.
"""

import json
import re
from html import escape
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse

from src.config import get_settings
from src.services.seo_render import SeoResult, render_seo

router = APIRouter(tags=["spa"])

_FALLBACK_TEMPLATE = (
    '<!doctype html><html lang="ru"><head><meta charset="UTF-8">'
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    '</head><body><div id="root"></div>'
    '<script type="module" src="/src/main.tsx"></script></body></html>'
)

# Tags we always control per-route — strip any static copies from the template
# so the served HTML has exactly one of each (no duplicate canonical/OG).
_STRIP = re.compile(
    r"<title>.*?</title>"
    r'|<meta\s+name="description"[^>]*>'
    r'|<meta\s+property="og:[^"]*"[^>]*>'
    r'|<meta\s+name="twitter:[^"]*"[^>]*>'
    r'|<link\s+rel="canonical"[^>]*>'
    r"|<script[^>]*data-managed-ld[^>]*>.*?</script>",
    re.IGNORECASE | re.DOTALL,
)


def _template() -> str:
    path = Path(get_settings().frontend_dist) / "index.html"
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return _FALLBACK_TEMPLATE


def _base(request: Request) -> str:
    site = get_settings().site_url
    return (site or str(request.base_url)).rstrip("/")


def _head(r: SeoResult) -> str:
    robots = "noindex, nofollow" if r.noindex else "index, follow"
    tags = [
        f"<title>{escape(r.title)}</title>",
        f'<meta name="description" content="{escape(r.description)}">',
        f'<meta name="robots" content="{robots}">',
        f'<link rel="canonical" href="{escape(r.canonical)}">',
        '<meta property="og:site_name" content="AnimeWatch">',
        '<meta property="og:locale" content="ru_RU">',
        f'<meta property="og:type" content="{escape(r.og_type)}">',
        f'<meta property="og:title" content="{escape(r.title)}">',
        f'<meta property="og:description" content="{escape(r.description)}">',
        f'<meta property="og:url" content="{escape(r.canonical)}">',
        f'<meta property="og:image" content="{escape(r.image)}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{escape(r.title)}">',
        f'<meta name="twitter:description" content="{escape(r.description)}">',
        f'<meta name="twitter:image" content="{escape(r.image)}">',
        *r.extra_head,
    ]
    if r.json_ld is not None:
        payload = json.dumps(r.json_ld, ensure_ascii=False).replace("<", "\\u003c")
        tags.append(
            f'<script type="application/ld+json" data-managed-ld>{payload}</script>'
        )
    return "\n".join(tags)


def _render_html(template: str, r: SeoResult) -> str:
    html = _STRIP.sub("", template)
    html = html.replace("</head>", f"{_head(r)}\n</head>", 1)
    # Crawlable content lives inside #root; React clears it on mount.
    html = re.sub(
        r'(<div id="root">)(\s*</div>)', rf"\1{r.body_html}</div>", html, count=1
    )
    return html


def _static_file(path: str) -> FileResponse | None:
    """Return a dist file for asset-like paths (has an extension, exists, safe)."""
    if "." not in path.rsplit("/", 1)[-1]:
        return None
    dist = Path(get_settings().frontend_dist).resolve()
    target = (dist / path).resolve()
    if dist in target.parents and target.is_file():
        return FileResponse(target)
    return None


@router.get("/{full_path:path}", response_model=None)
async def spa(
    full_path: str, request: Request
) -> HTMLResponse | FileResponse | JSONResponse:
    # Unknown API-ish paths must 404 as JSON, not the HTML shell.
    if full_path.startswith(("api/", "admin/", "internal/")):
        return JSONResponse({"detail": "Not Found"}, status_code=404)

    static = _static_file(full_path)
    if static is not None:
        return static

    result = await render_seo(full_path, _base(request))
    body = _render_html(_template(), result)
    return HTMLResponse(body, status_code=result.status)
