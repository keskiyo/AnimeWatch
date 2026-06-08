from dataclasses import dataclass
from os import environ
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    database_path: str
    cache_ttl: int
    shikimori_endpoint: str
    shikimori_user_agent: str
    kodik_endpoint: str
    kodik_api_key: str | None
    frontend_origins: list[str]


def get_settings() -> Settings:
    return Settings(
        database_path=environ.get("DATABASE_PATH", str(Path("data") / "animewatch.sqlite")),
        cache_ttl=_read_int("CACHE_TTL_SECONDS", 3600),
        shikimori_endpoint=environ.get("SHIKIMORI_ENDPOINT", "https://shikimori.one").rstrip("/"),
        shikimori_user_agent=environ.get(
            "SHIKIMORI_USER_AGENT",
            "AnimeWatch/0.1 (local development)",
        ),
        kodik_endpoint=environ.get("KODIK_ENDPOINT", "https://kodikapi.com").rstrip("/"),
        kodik_api_key=environ.get("KODIK_API_KEY") or environ.get("KODIK_TOKEN"),
        frontend_origins=_read_origins(),
    )


def _read_int(name: str, fallback: int) -> int:
    try:
        value = int(environ.get(name, ""))
    except ValueError:
        return fallback

    return value if value > 0 else fallback


def _read_origins() -> list[str]:
    raw = environ.get("FRONTEND_ORIGINS")
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]
