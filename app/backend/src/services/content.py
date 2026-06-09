from src.services.mock_data import MOCK_ANIME, mock_episodes


def get_episodes_for_anime(anime_id: int) -> list[dict]:
    return mock_episodes(anime_id)


def get_schedule(days: int, studio: str | None = None) -> dict[str, list[dict]]:
    limit = min(max(days, 1), 30)
    entries = {
        "2026-06-07": [
            {
                "anime": MOCK_ANIME[1],
                "episode": 5,
                "time": "2026-06-07T13:30:00Z",
                "studio": "Kodik",
            },
            {
                "anime": MOCK_ANIME[2],
                "episode": 1,
                "time": "2026-06-07T18:00:00Z",
                "studio": "AnimeVost",
            },
        ],
        "2026-06-08": [
            {
                "anime": MOCK_ANIME[0],
                "episode": 29,
                "time": "2026-06-08T17:00:00Z",
                "studio": "SovetRomantica",
            },
        ],
    }
    sliced = dict(list(entries.items())[:limit])
    if studio:
        return {
            date: [
                item for item in schedule if item["studio"].lower() == studio.lower()
            ]
            for date, schedule in sliced.items()
        }
    return sliced


def get_studios(kodik_configured: bool) -> list[dict]:
    return [
        {"name": "AniLibria", "available": True, "api_status": "mock-online"},
        {"name": "AnimeVost", "available": True, "api_status": "mock-online"},
        {
            "name": "Kodik",
            "available": kodik_configured,
            "api_status": "configured" if kodik_configured else "needs-token",
        },
    ]


def get_studio_anime_availability(name: str, anime_id: int) -> dict:
    episodes = [episode["episode_number"] for episode in mock_episodes(anime_id)]
    available = [episode for episode in episodes if name and episode % 2 == 0]
    return {"episodes": episodes, "available_episodes": available or episodes[:3]}


def get_aniboom_player(anime_id: int, episode_number: int) -> dict:
    return {"url": f"https://aniboom.one/embed/{anime_id}-{episode_number}"}
