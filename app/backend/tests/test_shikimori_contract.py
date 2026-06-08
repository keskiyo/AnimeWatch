from types import SimpleNamespace

import pytest
from src.services import shikimori
from src.services.shikimori import (
    create_shikimori_anime_list_params,
    fetch_shikimori_catalog,
    normalize_shikimori_anime,
)


def test_shikimori_params_keep_sort_and_announcement_policy():
    date_params = create_shikimori_anime_list_params(
        {"sort": "date", "page": "1", "limit": "12"}
    )
    novelty_params = create_shikimori_anime_list_params(
        {"sort": "novelty", "page": "1", "limit": "12"}
    )

    assert date_params["order"] == "id_desc"
    assert "status" not in date_params
    assert novelty_params["order"] == "aired_on"
    assert novelty_params["status"] == "ongoing,released"


def test_shikimori_params_do_not_send_unsupported_sort_direction():
    rating_params = create_shikimori_anime_list_params(
        {"sort": "rating", "order": "asc", "page": "1", "limit": "12"}
    )

    assert rating_params["order"] == "ranked"
    assert "direction" not in rating_params


@pytest.mark.anyio
async def test_shikimori_catalog_applies_local_ascending_rating_order(monkeypatch):
    async def fake_cached_json(*_args, **_kwargs):
        return [
            _raw_anime(1, "High", "9.0"),
            _raw_anime(2, "Low", "6.0"),
            _raw_anime(3, "Middle", "7.5"),
        ]

    monkeypatch.setattr(shikimori, "get_cached_json", fake_cached_json)
    monkeypatch.setattr(shikimori, "_default_cache", lambda _settings: object())

    result = await fetch_shikimori_catalog(
        {"sort": "rating", "order": "asc", "page": "1", "limit": "3"},
        SimpleNamespace(
            cache_ttl=1,
            database_path=":memory:",
            shikimori_endpoint="https://shikimori.one",
        ),
    )

    assert [item["rating"] for item in result["data"]] == [6.0, 7.5, 9.0]


def test_shikimori_normalization_keeps_frontend_anime_model():
    anime = normalize_shikimori_anime(
        {
            "id": 42,
            "name": "Original Title",
            "russian": "Russian Title",
            "image": {
                "original": "/system/animes/original/42.jpg",
                "preview": "/system/animes/preview/42.jpg",
            },
            "url": "/animes/42-original-title",
            "kind": "tv_special",
            "score": "7.35",
            "status": "anons",
            "episodes": 12,
            "episodes_aired": 3,
            "aired_on": "2026-07-03",
            "released_on": None,
            "english": ["English Title"],
            "japanese": ["Japanese Title"],
            "description": "Synopsis",
            "myanimelist_id": 1234,
            "rates_scores_stats": [{"name": 10, "value": 30}, {"name": 9, "value": 20}],
            "genres": [{"id": 1, "name": "Drama", "russian": "Drama", "kind": "anime"}],
            "studios": [
                {"id": 1, "name": "Bones", "filtered_name": "bones", "real": True}
            ],
            "updated_at": "2026-06-01T10:00:00.000+03:00",
        },
        "https://shikimori.one",
        "2026-06-08T00:00:00+00:00",
    )

    assert anime["id"] == 42
    assert anime["mal_id"] == 1234
    assert anime["title_ru"] == "Russian Title"
    assert anime["title_en"] == "English Title"
    assert anime["poster_url"] == "https://shikimori.one/system/animes/original/42.jpg"
    assert anime["type"] == "special"
    assert anime["status"] == "announced"
    assert anime["season"] == "summer"
    assert anime["score_count"] == 50


def _raw_anime(anime_id: int, name: str, score: str) -> dict:
    return {
        "id": anime_id,
        "name": name,
        "russian": name,
        "image": {"original": f"/system/animes/original/{anime_id}.jpg"},
        "url": f"/animes/{anime_id}-{name.lower()}",
        "kind": "tv",
        "score": score,
        "status": "released",
        "episodes": 12,
        "episodes_aired": 12,
        "aired_on": "2024-01-01",
        "english": [name],
        "japanese": [name],
        "genres": [],
        "studios": [],
    }
