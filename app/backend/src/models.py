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
