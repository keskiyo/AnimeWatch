"""AnimeWatch API: app assembly (CORS, routers, startup)."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from src.config import get_settings
from src.db.indexes import ensure_indexes
from src.db.mongo import close_client, get_db
from src.logger import configure_logging, get_logger
from src.routers.admin.audit import router as admin_audit_router
from src.routers.admin.comments import router as admin_comments_router
from src.routers.admin.static_pages import router as admin_static_pages_router
from src.routers.admin.sync import router as admin_sync_router
from src.routers.admin.user_actions import router as admin_user_actions_router
from src.routers.admin.users import router as admin_users_router
from src.routers.anime import router as anime_router
from src.routers.auth import router as auth_router
from src.routers.comments import router as comments_router
from src.routers.frontend_host import router as frontend_host_router
from src.routers.internal_catalog import router as internal_catalog_router
from src.routers.library import router as library_router
from src.routers.player import router as player_router
from src.routers.seo import router as seo_router
from src.routers.static_pages import router as static_pages_router
from src.routers.system import router as system_router
from src.services.shikimori.sync import maybe_start_daily_recent_sync
from src.services.user.auth import seed_admin_user

configure_logging()
log = get_logger(__name__)


env = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await ensure_indexes(get_db())
    await seed_admin_user()
    await maybe_start_daily_recent_sync(env)

    yield

    close_client()


app = FastAPI(title="AnimeWatch API", lifespan=lifespan)

# Compress JSON responses (big win for /anime/bulk). ~5–8× on large payloads.
app.add_middleware(GZipMiddleware, minimum_size=1000)


if not env.kodik_api_key:
    log.warning("KODIK_API_KEY not set — video player will be unavailable")

app.add_middleware(
    CORSMiddleware,
    allow_origins=env.frontend_origins,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):(5173|5174)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system_router)
app.include_router(seo_router)
app.include_router(anime_router)
app.include_router(player_router)
app.include_router(library_router)
app.include_router(auth_router)
app.include_router(comments_router)
app.include_router(static_pages_router)
app.include_router(admin_audit_router)
app.include_router(admin_comments_router)
app.include_router(admin_static_pages_router)
app.include_router(admin_user_actions_router)
app.include_router(admin_users_router)
app.include_router(admin_sync_router)
app.include_router(internal_catalog_router)

# SPA host with server-side SEO injection — MUST be last (catch-all `/{path}`).
app.include_router(frontend_host_router)
