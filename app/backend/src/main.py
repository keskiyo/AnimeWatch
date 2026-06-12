"""AnimeWatch API: app assembly (CORS, routers, startup)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings
from src.logger import configure_logging, get_logger

configure_logging()
log = get_logger(__name__)

from src.db.anime_catalog import ensure_anime_catalog_schema
from src.db.admin_audit import ensure_admin_audit_schema
from src.db.sync_state import ensure_sync_state_schema
from src.routers.admin_audit import router as admin_audit_router
from src.routers.admin_sync import router as admin_sync_router
from src.routers.admin_users import router as admin_users_router
from src.routers.anime import router as anime_router
from src.routers.auth import router as auth_router
from src.routers.comments import router as comments_router
from src.routers.internal_catalog import router as internal_catalog_router
from src.routers.library import router as library_router
from src.routers.player import router as player_router
from src.routers.system import router as system_router
from src.services.auth import seed_admin_user
from src.services.shikimori.sync import maybe_start_daily_recent_sync

env = get_settings()
app = FastAPI(title="AnimeWatch API")

if not env.kodik_api_key:
    log.warning("KODIK_API_KEY not set — video player will be unavailable")

app.add_middleware(
    CORSMiddleware,
    allow_origins=env.frontend_origins,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system_router)
app.include_router(anime_router)
app.include_router(player_router)
app.include_router(library_router)
app.include_router(auth_router)
app.include_router(comments_router)
app.include_router(admin_audit_router)
app.include_router(admin_users_router)
app.include_router(admin_sync_router)
app.include_router(internal_catalog_router)


@app.on_event("startup")
async def _startup() -> None:
    ensure_anime_catalog_schema(env.database_path)
    ensure_admin_audit_schema(env.database_path)
    ensure_sync_state_schema(env.database_path)
    seed_admin_user()
    await maybe_start_daily_recent_sync(env)
