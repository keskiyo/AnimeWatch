from dataclasses import dataclass
from os import environ
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env once at import time (src/config.py → backend/.env).
# Existing environment variables take precedence (override=False).
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    mongodb_uri: str
    mongodb_db: str
    legacy_sqlite_path: str  # only for the one-time SQLite→Mongo migration script
    data_dir: str  # local file storage (e.g. uploaded avatars)
    cache_ttl: int
    shikimori_endpoint: str
    shikimori_user_agent: str
    kodik_endpoint: str
    kodik_api_key: str | None
    frontend_origins: list[str]
    yummyanime_endpoint: str
    yummyanime_token: str | None
    shikimori_gql_endpoint: str
    admin_sync_token: str | None
    allow_shikimori_bulk_fallback: bool
    catalog_refresh_token: str | None
    catalog_refresh_timeout_ms: int
    site_url: str | None
    frontend_dist: str  # built SPA dir (index.html + assets) for server-side SEO host


def get_settings() -> Settings:
    return Settings(
        # Prefer the project's .env names (DB_CONNECTION_STRING_MONGODB / DBNAME_MONGODB);
        # MONGODB_URI / MONGODB_DB kept as compatibility aliases.
        mongodb_uri=(
            environ.get("DB_CONNECTION_STRING_MONGODB")
            or environ.get("MONGODB_URI")
            or "mongodb://localhost:27017"
        ),
        mongodb_db=(
            environ.get("DBNAME_MONGODB")
            or environ.get("MONGODB_DB")
            or "animewatch"
        ),
        # Old SQLite DB for the one-time migration; DATABASE_PATH is the legacy name.
        legacy_sqlite_path=(
            environ.get("LEGACY_SQLITE_PATH")
            or environ.get("DATABASE_PATH")
            or str(Path("data") / "anime-viewer.db")
        ),
        data_dir=environ.get("DATA_DIR") or "data",
        # Support both CACHE_TTL_SECONDS (new) and CACHE_TTL (legacy)
        cache_ttl=_read_int("CACHE_TTL_SECONDS", _read_int("CACHE_TTL", 3600)),
        # Support both SHIKIMORI_ENDPOINT (new) and SHIKIMORI_BASE_URL (legacy)
        shikimori_endpoint=(
            environ.get("SHIKIMORI_ENDPOINT")
            or environ.get("SHIKIMORI_BASE_URL")
            or "https://shikimori.one"
        ).rstrip("/"),
        shikimori_user_agent=environ.get(
            "SHIKIMORI_USER_AGENT",
            "AnimeWatch/0.1 (local development)",
        ),
        # Support both KODIK_ENDPOINT (new) and KODIK_API_ENDPOINT (legacy)
        kodik_endpoint=(
            environ.get("KODIK_ENDPOINT")
            or environ.get("KODIK_API_ENDPOINT")
            or "https://kodik-api.com"
        ).rstrip("/"),
        kodik_api_key=environ.get("KODIK_API_KEY") or environ.get("KODIK_TOKEN"),
        frontend_origins=_read_origins(),
        yummyanime_endpoint=(
            environ.get("YUMMYANIME_API_ENDPOINT") or "https://api.yani.tv"
        ).rstrip("/"),
        yummyanime_token=(
            environ.get("YUMMYANIME_PRIVATE_TOKEN")
            or environ.get("YUMMYANIME_PUBLIC_TOKEN")
            or None
        ),
        shikimori_gql_endpoint=(
            environ.get("SHIKIMORI_GQL_ENDPOINT") or "https://shikimori.io/api/graphql"
        ).rstrip("/"),
        admin_sync_token=environ.get("ADMIN_SYNC_TOKEN") or None,
        allow_shikimori_bulk_fallback=(
            environ.get("ALLOW_SHIKIMORI_BULK_FALLBACK", "").lower() == "true"
        ),
        catalog_refresh_token=environ.get("CATALOG_REFRESH_TOKEN") or None,
        catalog_refresh_timeout_ms=_read_int("CATALOG_REFRESH_TIMEOUT_MS", 7_200_000),
        site_url=environ.get("SITE_URL") or None,
        frontend_dist=environ.get("FRONTEND_DIST")
        or str(Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"),
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
