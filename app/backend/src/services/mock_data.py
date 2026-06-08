from datetime import UTC, datetime, timedelta

from src.models import Anime

NOW = datetime(2026, 6, 7, 8, tzinfo=UTC).isoformat().replace("+00:00", "Z")

MOCK_ANIME: list[Anime] = [
    {
        "id": 52991,
        "mal_id": 52991,
        "title_ru": "Frieren",
        "title_en": "Frieren Beyond Journey End",
        "title_jp": "Sousou no Frieren",
        "poster_url": "https://shikimori.one/uploads/poster/animes/52991/main.webp",
        "description": "Frieren starts a quiet journey through memory, time, and the people she outlives.",
        "genres": ["Adventure", "Drama", "Fantasy"],
        "studio": "Madhouse",
        "type": "tv",
        "status": "released",
        "year": 2023,
        "season": "fall",
        "episodes_total": 28,
        "episodes_aired": 28,
        "rating": 9.1,
        "score_count": 310000,
        "url_shikimori": "https://shikimori.one/animes/52991",
        "updated_at": NOW,
    },
    {
        "id": 56321,
        "title_ru": "Zhong Kui",
        "title_en": "Zhong Kui",
        "title_jp": "Zhong Kui",
        "poster_url": "https://shikimori.one/uploads/poster/animes/56321/main.webp",
        "description": "A fantasy title kept in mock data for local development.",
        "genres": ["Action", "Fantasy"],
        "studio": "Studio",
        "type": "tv",
        "status": "ongoing",
        "year": 2026,
        "season": "summer",
        "episodes_total": 12,
        "episodes_aired": 4,
        "rating": 7.2,
        "score_count": 1200,
        "url_shikimori": "https://shikimori.one/animes/56321-zhong-kui",
        "updated_at": NOW,
    },
    {
        "id": 61378,
        "title_ru": "Dandadan Season 2",
        "title_en": "Dandadan Season 2",
        "title_jp": "Dandadan 2",
        "poster_url": "https://shikimori.one/uploads/poster/animes/61378/main.webp",
        "description": "Momo and Okarun keep running into supernatural threats.",
        "genres": ["Action", "Comedy", "Supernatural"],
        "studio": "Science SARU",
        "type": "tv",
        "status": "announced",
        "year": 2026,
        "season": "summer",
        "episodes_total": 12,
        "episodes_aired": 0,
        "rating": 0,
        "score_count": 0,
        "updated_at": NOW,
    },
]


def mock_episodes(anime_id: int) -> list[dict]:
    anime = next((item for item in MOCK_ANIME if item["id"] == anime_id), None)
    if not anime:
        return []

    total = min(int(anime["episodes_total"]), 6)
    return [
        {
            "id": f"{anime_id}-{index}",
            "anime_id": anime_id,
            "episode_number": index,
            "title": f"Episode {index}",
            "release_date_jp": (
                datetime(2026, 6, 7, 13, 30, tzinfo=UTC) + timedelta(days=index)
            ).isoformat(),
            "release_date_dub": (
                datetime(2026, 6, 7, 18, tzinfo=UTC) + timedelta(days=index)
            ).isoformat(),
            "duration": 24,
            "players": {
                "kodik": {
                    "url": f"https://kodik.info/serial/{anime_id}/{index}/720p",
                    "quality": ["480p", "720p"],
                },
                "aniboom": {"url": f"https://aniboom.one/embed/{anime_id}-{index}"},
            },
            "dubbing_studios": ["AniLibria", "SovetRomantica", "AnimeVost"],
        }
        for index in range(1, total + 1)
    ]
