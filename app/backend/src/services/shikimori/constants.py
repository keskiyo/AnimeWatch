"""Mapping tables between app values and Shikimori REST/GraphQL values."""

APP_STATUS_TO_SHIKIMORI = {
    "ongoing": "ongoing",
    "released": "released",
    "announced": "anons",
}

SORT_TO_SHIKIMORI = {
    "rating": "ranked",
    "popularity": "popularity",
    "novelty": "aired_on",
    "date": "id_desc",
    "title": "name",
    "startDate": "aired_on",
    "createdAt": "id_desc",
}

# ── Shikimori GraphQL OrderEnum ───────────────────────────────────────────────
# GQL enum values are snake_case ("aired_on"), NOT camelCase field names
# ("airedOn" is a response field, not an enum value — it fails the whole query).
GQL_ORDER_ENUM = {
    "none",
    "ranked",
    "kind",
    "popularity",
    "name",
    "aired_on",
    "episodes",
    "status",
    "random",
    "ranked_random",
    "ranked_shiki",
    "created_at",
    "created_at_desc",
}
GQL_ORDER_FALLBACK = "aired_on"

# app/REST sort value → GQL OrderEnum value
APP_SORT_TO_GQL_ORDER = {
    "airedOn": "aired_on",
    "releasedOn": "aired_on",
    "rating": "ranked",
    "popularity": "popularity",
    "novelty": "aired_on",
    "startDate": "aired_on",
    "title": "name",
    "name": "name",
    "date": "created_at_desc",
    "createdAt": "created_at_desc",
}

TYPE_TO_SHIKIMORI = {
    "tv": "tv",
    "ova": "ova",
    "movie": "movie",
    "ona": "ona",
    "special": "special,tv_special",
}

KIND_TO_TYPE = {
    "tv": "tv",
    "movie": "movie",
    "ova": "ova",
    "ona": "ona",
    "special": "special",
    "tv_special": "special",
}

STATUS_TO_APP = {"ongoing": "ongoing", "released": "released", "anons": "announced"}

GQL_STATUS_TO_APP = {
    "ongoing": "ongoing",
    "released": "released",
    "anons": "announced",
    "Ongoing": "ongoing",
    "Released": "released",
    "Anons": "announced",
}

GENRE_RU_TO_SHIKIMORI_ID: dict[str, int] = {
    "Экшен": 1,
    "Приключения": 2,
    "Машины": 3,
    "Комедия": 4,
    "Деменция": 5,
    "Демоны": 6,
    "Мистика": 7,
    "Драма": 8,
    "Этти": 9,
    "Фэнтези": 10,
    "Игры": 11,
    "Исторический": 13,
    "Ужасы": 14,
    "Детское": 15,
    "Магия": 16,
    "Боевые искусства": 17,
    "Меха": 18,
    "Музыка": 19,
    "Пародия": 20,
    "Самураи": 21,
    "Романтика": 22,
    "Школа": 23,
    "Фантастика": 24,
    "Сёдзё": 25,
    "Сёдзё-ай": 26,
    "Сёнэн": 27,
    "Сёнэн-ай": 28,
    "Космос": 29,
    "Спорт": 30,
    "Суперсила": 31,
    "Вампиры": 32,
    "Яой": 33,
    "Юри": 34,
    "Гарем": 35,
    "Повседневность": 36,
    "Сверхъестественное": 37,
    "Военное": 38,
    "Полиция": 39,
    "Психологическое": 40,
    "Триллер": 41,
    "Сейнен": 42,
    "Дзёсэй": 43,
}
