"""
Shikimori data layer.

Data sources:
  - GraphQL  https://shikimori.io/api/graphql  – primary (real poster URLs,
             genres, themes, studios, full fields for new & old anime)
  - REST     https://shikimori.one/api/...      – fallback for list queries
             and for endpoints not yet exposed via GQL (roles, screenshots)

Module layout:
  constants.py   – mapping tables (statuses, sorts, genres, GQL enums)
  fields.py      – GraphQL field sets
  rate_limit.py  – process-wide request throttling (no 429 bursts)
  http.py        – GQL/REST fetchers with retries + order mapper
  normalizers.py – raw payload → Anime conversion, roles/screenshots merge
  catalog.py     – paginated REST catalog
  sync.py        – bulk 1990+ catalog synchronisation (GQL)
  details.py     – single anime detail (GQL + roles/screenshots)
  ongoing.py     – currently airing anime
  studio.py      – anime by production studio
  related.py     – related anime
  posters.py     – poster enrichment for missing images
  helpers.py     – pure helpers + shared cache accessor
"""

from src.services.shikimori.catalog import (
    create_shikimori_anime_list_params,
    fetch_shikimori_catalog,
)
from src.services.shikimori.details import fetch_shikimori_anime
from src.services.shikimori.helpers import get_cache
from src.services.shikimori.http import to_gql_order
from src.services.shikimori.normalizers import (
    normalize_shikimori_anime,
    normalize_shikimori_gql_anime,
)
from src.services.shikimori.ongoing import fetch_shikimori_ongoing
from src.services.shikimori.related import fetch_shikimori_related
from src.services.shikimori.studio import fetch_shikimori_anime_by_studio
from src.services.shikimori.sync import fetch_shikimori_bulk_catalog

__all__ = [
    "create_shikimori_anime_list_params",
    "fetch_shikimori_anime",
    "fetch_shikimori_anime_by_studio",
    "fetch_shikimori_bulk_catalog",
    "fetch_shikimori_catalog",
    "fetch_shikimori_ongoing",
    "fetch_shikimori_related",
    "get_cache",
    "normalize_shikimori_anime",
    "normalize_shikimori_gql_anime",
    "to_gql_order",
]
