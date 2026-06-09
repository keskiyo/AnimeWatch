from typing import Literal, TypedDict


AnimeType = Literal["tv", "ova", "movie", "ona", "special"]
AnimeStatus = Literal["ongoing", "released", "announced"]
AnimeSeason = Literal["winter", "spring", "summer", "fall"]
PlayerName = Literal["kodik", "aniboom"]
WatchlistStatus = Literal["watching", "planned", "completed", "dropped"]


class Anime(TypedDict, total=False):
    id: int
    mal_id: int
    anilist_id: int
    title_ru: str
    title_en: str
    title_jp: str
    poster_url: str
    description: str
    genres: list[str]
    studio: str
    type: AnimeType
    status: AnimeStatus
    year: int
    season: AnimeSeason
    episodes_total: int
    episodes_aired: int
    rating: float
    score_count: int
    url_shikimori: str
    url_anilist: str
    updated_at: str
    next_episode_at: str      # ISO date of the next episode air time (ongoings only)
    # Extended detail fields (only populated by the anime-detail endpoint)
    rating_mpaa: str          # Shikimori age rating: "g","pg","pg_13","r","r17","rx"
    duration: int             # Episode duration in minutes
    source: str               # Original source: "manga","light_novel","original", etc.
    directors: list           # [{"name": str, "url": str}, ...]
    authors: list             # [{"name": str, "url": str}, ...]
    characters: list          # [{"name": str, "url": str}, ...] (main only, ≤6)
    screenshots: list         # List of screenshot URL strings (from Shikimori)
