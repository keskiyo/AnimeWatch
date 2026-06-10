"""Read queries over the anime_catalog table: filters, sorting, pages, stats."""

from typing import Any

from src.db.anime_catalog import connect, row_to_anime
from src.models import Anime

# Catalog sort: ongoing → released → announced
_STATUS_RANK_SQL = (
    "CASE status WHEN 'ongoing' THEN 0 WHEN 'released' THEN 1 ELSE 2 END"
)

_SORTS: dict[str, str] = {
    "rating": "rating",
    "popularity": "score_count",
    "novelty": "year",
    "startDate": "year",
    "title": "title_ru COLLATE NOCASE",
    "date": "id",
    "createdAt": "id",
}


def get_anime_catalog_by_id(database_path: str, anime_id: int) -> Anime | None:
    row = connect(database_path).execute(
        "SELECT * FROM anime_catalog WHERE id = ?", (anime_id,)
    ).fetchone()
    return row_to_anime(row) if row else None


def get_anime_catalog_all(database_path: str) -> list[Anime]:
    """Full catalog in default order: ongoing → released → announced, year desc."""
    rows = connect(database_path).execute(
        f"SELECT * FROM anime_catalog ORDER BY {_STATUS_RANK_SQL}, year DESC, rating DESC"
    ).fetchall()
    return [row_to_anime(row) for row in rows]


def get_anime_catalog_count(
    database_path: str, query: dict[str, str | None]
) -> int:
    where_sql, args = _build_filters(query)
    row = connect(database_path).execute(
        f"SELECT COUNT(*) FROM anime_catalog{where_sql}", args
    ).fetchone()
    return int(row[0]) if row else 0


def get_anime_catalog_page(
    database_path: str, query: dict[str, str | None]
) -> dict:
    where_sql, args = _build_filters(query)
    order_sql = _order_clause(query)

    page = max(_to_int(query.get("page")) or 1, 1)
    limit = min(max(_to_int(query.get("limit")) or 24, 1), 100)
    offset = (page - 1) * limit

    total = get_anime_catalog_count(database_path, query)
    rows = connect(database_path).execute(
        f"SELECT * FROM anime_catalog{where_sql}{order_sql} LIMIT ? OFFSET ?",
        [*args, limit, offset],
    ).fetchall()

    return {
        "data": [row_to_anime(row) for row in rows],
        "total": total,
        "page": page,
    }


def get_anime_catalog_stats(database_path: str) -> dict:
    conn = connect(database_path)
    count_row = conn.execute("SELECT COUNT(*) FROM anime_catalog").fetchone()
    minmax_row = conn.execute(
        "SELECT MIN(year), MAX(year) FROM anime_catalog WHERE year > 0"
    ).fetchone()
    by_year_rows = conn.execute(
        "SELECT year, COUNT(*) FROM anime_catalog GROUP BY year ORDER BY year"
    ).fetchall()
    return {
        "count": int(count_row[0]) if count_row else 0,
        "min_year": minmax_row[0] if minmax_row else None,
        "max_year": minmax_row[1] if minmax_row else None,
        "by_year": {str(row[0]): row[1] for row in by_year_rows},
    }


# ── Filter / order builders ───────────────────────────────────────────────────


def _build_filters(query: dict[str, str | None]) -> tuple[str, list[Any]]:
    where: list[str] = []
    args: list[Any] = []

    search = (query.get("search") or "").strip().lower()
    if search:
        like = f"%{search}%"
        where.append(
            "(LOWER(title_ru) LIKE ? OR LOWER(title_en) LIKE ? OR LOWER(title_jp) LIKE ?)"
        )
        args.extend([like, like, like])

    statuses = _split(query.get("status"))
    if statuses:
        where.append(f"status IN ({_marks(statuses)})")
        args.extend(statuses)

    types = _split(query.get("type"))
    if types:
        where.append(f"type IN ({_marks(types)})")
        args.extend(types)

    seasons = _split(query.get("season"))
    if seasons:
        where.append(f"season IN ({_marks(seasons)})")
        args.extend(seasons)

    year_from = _to_int(query.get("year_from") or query.get("yearFrom"))
    if year_from:
        where.append("year >= ?")
        args.append(year_from)

    year_to = _to_int(query.get("year_to") or query.get("yearTo"))
    if year_to:
        where.append("year <= ?")
        args.append(year_to)

    ratings = _split(query.get("age_rating"))
    if ratings:
        where.append(f"rating_mpaa IN ({_marks(ratings)})")
        args.extend(ratings)

    # genres_json holds a JSON array — match any of the requested genres
    genres = _split(query.get("genres") or query.get("genre"))
    if genres:
        genre_clauses = []
        for genre in genres:
            genre_clauses.append("genres_json LIKE ?")
            args.append(f'%"{genre}"%')
        where.append("(" + " OR ".join(genre_clauses) + ")")

    return (" WHERE " + " AND ".join(where)) if where else "", args


def _order_clause(query: dict[str, str | None]) -> str:
    sort = str(query.get("sort") or "")
    direction = (
        "ASC" if (query.get("direction") or query.get("order")) == "asc" else "DESC"
    )

    column = _SORTS.get(sort)
    if column is None:
        # Default: ongoing first, newest first, best first
        return f" ORDER BY {_STATUS_RANK_SQL}, year DESC, rating DESC"
    if sort == "title":
        # Titles read naturally A→Z unless asc/desc is flipped explicitly
        return f" ORDER BY {column} {'ASC' if direction == 'DESC' else 'DESC'}"
    if sort in ("novelty", "startDate"):
        return f" ORDER BY year {direction}, id {direction}"
    return f" ORDER BY {column} {direction}"


def _split(value: str | None) -> list[str]:
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


def _marks(values: list) -> str:
    return ",".join("?" * len(values))


def _to_int(value: str | None) -> int | None:
    try:
        return int(value or "")
    except (ValueError, TypeError):
        return None
