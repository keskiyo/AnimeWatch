"""Per-route SEO data (title, meta, canonical, JSON-LD, crawlable body).

Read once per HTML document request by routers/frontend_host.py and injected
into the served index.html so non-JS crawlers (Yandex, Bing, social scrapers)
get a fully-formed page. The SPA replaces #root on hydration.
"""

import re
from dataclasses import dataclass, field
from html import escape
from urllib.parse import quote

from src.db.anime_catalog_home import get_home_season_anime
from src.db.anime_catalog_lookup import get_anime_catalog_by_studio
from src.db.anime_catalog_queries import (
    get_anime_catalog_by_id,
    get_anime_catalog_page,
    get_distinct_genres,
)
from src.db.static_pages import ALLOWED_STATIC_PAGE_SLUGS, get_static_page
from src.models import Anime
from src.services.seo import genre_slug
from src.services.seo_jsonld import anime_jsonld, collection_jsonld, website_jsonld

DEFAULT_DESCRIPTION = (
    "AnimeWatch — смотрите аниме онлайн: большой каталог, онгоинги, "
    "расписание серий и страницы тайтлов с плеером."
)
DEFAULT_IMAGE = "/AnimeWatch.png"


@dataclass
class SeoResult:
    title: str = "AnimeWatch — смотреть аниме онлайн"
    description: str = DEFAULT_DESCRIPTION
    canonical: str = "/"
    og_type: str = "website"
    image: str = DEFAULT_IMAGE
    noindex: bool = False
    status: int = 200
    json_ld: dict | list | None = None
    body_html: str = ""
    extra_head: list[str] = field(default_factory=list)


async def render_seo(path: str, base: str) -> SeoResult:
    """Build SEO data for an SPA route path (no query string)."""
    p = "/" + path.strip("/")
    if p == "/":
        return await _home(base)
    if p == "/anime":
        return await _catalog(base)
    if p == "/ongoing":
        return await _ongoing(base)
    if p.startswith("/anime/zhanr/"):
        return await _genre(p.removeprefix("/anime/zhanr/"), base)
    if p.startswith("/anime/"):
        return await _detail(p.removeprefix("/anime/"), base)
    if p.startswith("/studio/"):
        return await _studio(p.removeprefix("/studio/"), base)
    if p.lstrip("/") in ALLOWED_STATIC_PAGE_SLUGS:
        return await _static(p.lstrip("/"), base)
    if p.startswith(("/admin", "/profile", "/dubbing")):
        return SeoResult(canonical=f"{base}{p}", noindex=True)
    return SeoResult(
        title="Страница не найдена — AnimeWatch",
        canonical=f"{base}{p}",
        noindex=True,
        status=404,
        body_html="<main><h1>Страница не найдена</h1></main>",
    )


# ── route builders ─────────────────────────────────────────────────────────────


async def _home(base: str) -> SeoResult:
    items = await get_home_season_anime(20)
    return SeoResult(
        title="AnimeWatch — смотреть аниме онлайн бесплатно",
        canonical=f"{base}/",
        json_ld=website_jsonld(base),
        body_html=_list_body(
            "AnimeWatch — каталог аниме онлайн",
            "Смотрите аниме онлайн: онгоинги, сериалы, фильмы и OVA с русской "
            "озвучкой. Большой каталог с поиском, фильтрами и расписанием серий.",
            items,
            base,
        ),
    )


async def _catalog(base: str) -> SeoResult:
    page = await get_anime_catalog_page({"limit": "30"})
    return SeoResult(
        title="Каталог аниме — смотреть онлайн | AnimeWatch",
        description="Каталог аниме: фильтры по жанрам, году, статусу и типу. "
        "Смотрите аниме онлайн бесплатно.",
        canonical=f"{base}/anime",
        json_ld=collection_jsonld("Каталог аниме", f"{base}/anime"),
        body_html=_list_body(
            "Каталог аниме", "Все аниме каталога с фильтрами и поиском.",
            page.get("data") or [], base,
        ),
    )


async def _ongoing(base: str) -> SeoResult:
    items = await get_home_season_anime(20)
    return SeoResult(
        title="Онгоинги — аниме сейчас в эфире | AnimeWatch",
        description="Текущие онгоинги: аниме, которые выходят прямо сейчас, "
        "с расписанием новых серий.",
        canonical=f"{base}/ongoing",
        json_ld=collection_jsonld("Онгоинги", f"{base}/ongoing"),
        body_html=_list_body("Онгоинги", "Аниме в эфире прямо сейчас.", items, base),
    )


async def _detail(slug: str, base: str) -> SeoResult:
    anime_id = _slug_id(slug)
    anime = await get_anime_catalog_by_id(anime_id) if anime_id else None
    if not anime:
        return SeoResult(
            title="Аниме не найдено — AnimeWatch",
            canonical=f"{base}/anime/{escape(slug)}",
            noindex=True,
            status=404,
            body_html="<main><h1>Аниме не найдено</h1></main>",
        )
    name = anime.get("title_ru") or anime.get("title_en") or "Аниме"
    canonical = f"{base}/anime/{_slug(anime_id, anime)}"
    image = _img(base, anime.get("poster_url"))
    desc = _clean_desc(anime.get("description")) or DEFAULT_DESCRIPTION
    return SeoResult(
        title=f"{name} — смотреть онлайн | AnimeWatch",
        description=desc,
        canonical=canonical,
        og_type="video.tv_show",
        image=image,
        json_ld=anime_jsonld(anime, canonical, image, base),
        body_html=_detail_body(anime, name, desc, base),
    )


async def _genre(slug: str, base: str) -> SeoResult:
    genres = await get_distinct_genres()
    name = next((g for g in genres if genre_slug(g) == slug), None)
    canonical = f"{base}/anime/zhanr/{slug}"
    if not name:
        return SeoResult(
            title="Жанр не найден — AnimeWatch", canonical=canonical,
            noindex=True, status=404, body_html="<main><h1>Жанр не найден</h1></main>",
        )
    page = await get_anime_catalog_page({"genre": name, "limit": "30"})
    return SeoResult(
        title=f"Аниме {name} — смотреть онлайн | AnimeWatch",
        description=f"Аниме в жанре {name}: смотрите онлайн бесплатно на AnimeWatch. "
        "Полный список тайтлов с рейтингом и фильтрами.",
        canonical=canonical,
        json_ld=collection_jsonld(f"Аниме {name}", canonical),
        body_html=_list_body(
            f"Аниме в жанре «{name}»",
            f"Список аниме жанра {name}.",
            page.get("data") or [],
            base,
        ),
    )


async def _studio(name: str, base: str) -> SeoResult:
    studio = name.strip()
    items = await get_anime_catalog_by_studio(studio)
    return SeoResult(
        title=f"Студия {studio} — аниме онлайн | AnimeWatch",
        description=f"Все аниме студии {studio}: смотрите онлайн на AnimeWatch.",
        canonical=f"{base}/studio/{quote(studio)}",
        json_ld=collection_jsonld(f"Студия {studio}", f"{base}/studio/{quote(studio)}"),
        body_html=_list_body(
            f"Аниме студии {studio}", f"Тайтлы студии {studio}.", items, base
        ),
    )


async def _static(slug: str, base: str) -> SeoResult:
    page = await get_static_page(slug)
    title = (page or {}).get("title") or slug
    content = (page or {}).get("content") or ""
    return SeoResult(
        title=f"{title} — AnimeWatch",
        description=_clean_desc(content) or DEFAULT_DESCRIPTION,
        canonical=f"{base}/{slug}",
        body_html=f"<main><h1>{escape(title)}</h1>"
        f"<div>{escape(content)}</div></main>",
    )


# ── body / helper builders ──────────────────────────────────────────────────────


def _list_body(h1: str, intro: str, items: list[Anime], base: str) -> str:
    links = "".join(
        f'<li><a href="{base}/anime/{_slug(int(a["id"]), a)}">'
        f'{escape(a.get("title_ru") or a.get("title_en") or "")}</a></li>'
        for a in items
        if a.get("id")
    )
    return (
        f"<main><h1>{escape(h1)}</h1><p>{escape(intro)}</p>"
        f"<ul>{links}</ul></main>"
    )


def _detail_body(anime: Anime, name: str, desc: str, base: str) -> str:
    facts = []
    if anime.get("year"):
        facts.append(f"<dt>Год</dt><dd>{escape(str(anime['year']))}</dd>")
    if anime.get("studio"):
        facts.append(f"<dt>Студия</dt><dd>{escape(str(anime['studio']))}</dd>")
    if anime.get("genres"):
        facts.append(f"<dt>Жанры</dt><dd>{escape(', '.join(anime['genres']))}</dd>")
    if anime.get("episodes_total"):
        facts.append(
            f"<dt>Эпизоды</dt><dd>{escape(str(anime['episodes_total']))}</dd>"
        )
    return (
        f'<main><nav aria-label="breadcrumb"><a href="{base}/">Главная</a> / '
        f'<a href="{base}/anime">Каталог</a></nav>'
        f"<h1>{escape(name)}</h1><dl>{''.join(facts)}</dl>"
        f"<p>{escape(desc)}</p></main>"
    )


def _img(base: str, poster: str | None) -> str:
    if not poster:
        return f"{base}{DEFAULT_IMAGE}"
    if poster.startswith("/"):
        return f"{base}{poster}"
    return f"{base}/api/image-proxy?url={quote(poster, safe='')}&w=400"


def _clean_desc(text: object) -> str:
    if not text:
        return ""
    plain = re.sub(r"\[/?[^\]]+\]", " ", str(text))  # BBCode
    plain = re.sub(r"<[^>]+>", " ", plain)  # HTML
    plain = re.sub(r"\s+", " ", plain).strip()
    return f"{plain[:157].rstrip()}…" if len(plain) > 160 else plain


def _slug_id(slug: str) -> int:
    m = re.match(r"^(\d+)", slug)
    return int(m.group(1)) if m else 0


def _slug(anime_id: int, anime: Anime) -> str:
    from src.services.seo import anime_slug

    return anime_slug(anime_id, anime.get("title_en") or anime.get("title_ru") or "")
