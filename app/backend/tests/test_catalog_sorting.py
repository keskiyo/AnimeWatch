from src.services.catalog import filter_anime_catalog


def test_catalog_sorting_respects_direction_and_novelty_excludes_announcements():
    anime = [
        {"id": 1, "title_en": "A", "title_ru": "", "title_jp": "", "status": "released", "rating": 8.0, "score_count": 10, "year": 2024, "genres": [], "type": "tv"},
        {"id": 2, "title_en": "B", "title_ru": "", "title_jp": "", "status": "ongoing", "rating": 6.0, "score_count": 20, "year": 2026, "genres": [], "type": "tv"},
        {"id": 3, "title_en": "C", "title_ru": "", "title_jp": "", "status": "announced", "rating": 9.0, "score_count": 30, "year": 2027, "genres": [], "type": "tv"},
    ]

    rating_asc = filter_anime_catalog(anime, {"sort": "rating", "order": "asc"})
    novelty_desc = filter_anime_catalog(anime, {"sort": "novelty", "order": "desc"})
    date_desc = filter_anime_catalog(anime, {"sort": "date", "order": "desc"})

    assert [item["id"] for item in rating_asc["data"]] == [2, 1, 3]
    assert [item["id"] for item in novelty_desc["data"]] == [2, 1]
    assert [item["id"] for item in date_desc["data"]] == [3, 2, 1]
