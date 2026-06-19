"""Static pages (CMS) — Mongo `static_pages` collection (_id = slug).

DB is the source of truth: file defaults seed missing slugs ONCE (never
overwrite existing/edited rows). Admin edits via the panel are authoritative.
"""

from datetime import UTC, datetime
from pathlib import Path

from src.db.mongo import get_db, to_oid

ALLOWED_STATIC_PAGE_SLUGS = {"agreement", "privacy", "copyright"}

_CONTENT_DIR = Path(__file__).with_name("static_page_content")
_seeded = False


def _load_defaults() -> dict[str, tuple[str, str]]:
    defaults: dict[str, tuple[str, str]] = {}
    for slug in ALLOWED_STATIC_PAGE_SLUGS:
        title = (_CONTENT_DIR / f"{slug}.title.txt").read_text(encoding="utf-8").strip()
        content = (_CONTENT_DIR / f"{slug}.txt").read_text(encoding="utf-8").strip()
        defaults[slug] = (title, content)
    return defaults


async def _ensure_seeded() -> None:
    global _seeded
    if _seeded:
        return
    now = datetime.now(tz=UTC).isoformat()
    coll = get_db().static_pages
    for slug, (title, content) in _load_defaults().items():
        # $setOnInsert only fills a missing slug — never overwrites an edit.
        await coll.update_one(
            {"_id": slug},
            {"$setOnInsert": {"title": title, "content": content,
                              "updated_at": now, "updated_by": None}},
            upsert=True,
        )
    _seeded = True


def _page(doc: dict) -> dict:
    by = doc.get("updated_by")
    return {
        "slug": doc["_id"],
        "title": doc.get("title", ""),
        "content": doc.get("content", ""),
        "updated_at": doc.get("updated_at", ""),
        "updated_by": str(by) if by else None,
    }


async def list_static_pages() -> list[dict]:
    await _ensure_seeded()
    cursor = get_db().static_pages.find({}).sort("_id", 1)
    return [_page(doc) async for doc in cursor]


async def get_static_page(slug: str) -> dict | None:
    await _ensure_seeded()
    doc = await get_db().static_pages.find_one({"_id": slug})
    return _page(doc) if doc else None


async def update_static_page(
    slug: str, title: str, content: str, admin_id: object
) -> dict | None:
    await _ensure_seeded()
    await get_db().static_pages.update_one(
        {"_id": slug},
        {"$set": {"title": title, "content": content,
                  "updated_at": datetime.now(tz=UTC).isoformat(),
                  "updated_by": to_oid(admin_id)}},
    )
    return await get_static_page(slug)
