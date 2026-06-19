from src.db.anime_catalog_lookup import (
    get_anime_catalog_by_ids,
    get_anime_catalog_title_family,
)


async def enrich_related_from_catalog(related_items: list[dict]) -> list[dict]:
    """Return only related anime that exist in the local catalog."""
    ids = [int(item.get("id") or 0) for item in related_items]
    local_by_id = await get_anime_catalog_by_ids(ids)
    enriched: list[dict] = []
    for item in related_items:
        local = local_by_id.get(int(item.get("id") or 0))
        if not local:
            continue

        enriched.append(
            {
                **item,
                "title_ru": local.get("title_ru") or item.get("title_ru") or "",
                "title_en": local.get("title_en") or item.get("title_en") or "",
                "poster_url": local.get("poster_url") or item.get("poster_url") or "",
                "type": local.get("type") or item.get("type") or "tv",
                "year": local.get("year") or item.get("year") or 0,
                "rating": local.get("rating") or item.get("rating") or 0,
            }
        )
    return enriched


async def merge_related_with_catalog_family(
    anime_id: int,
    related_items: list[dict],
) -> list[dict]:
    """Add same-family catalog rows when Shikimori related cache is missing."""
    result = await enrich_related_from_catalog(related_items)
    seen_ids = {int(item.get("id") or 0) for item in result}

    for local in await get_anime_catalog_title_family(anime_id):
        local_id = int(local.get("id") or 0)
        if not local_id or local_id in seen_ids:
            continue
        result.append(
            {
                "id": local_id,
                "relation": "Связанное",
                "title_ru": local.get("title_ru") or "",
                "title_en": local.get("title_en") or "",
                "poster_url": local.get("poster_url") or "",
                "type": local.get("type") or "tv",
                "year": local.get("year") or 0,
                "rating": local.get("rating") or 0,
            }
        )
        seen_ids.add(local_id)

    return result
