# Backend Structure

Документ описывает, как устроена папка `app/backend` и куда добавлять новый код.
Подробная архитектура проекта также описана в корневом `Documentations.md`

## Корень `app/backend`

- `src/` — основной код FastAPI-приложения.
- `tests/` — pytest-тесты. В текущем gitignore папка может быть исключена,
  поэтому перед добавлением новых тестов проверь `git check-ignore`.
- `data/` — локальные SQLite-файлы и runtime-данные. Не хранить здесь код.
- `dist/`, `node_modules/`, `.pytest_cache/`, `__pycache__/` — сгенерированные
  артефакты, не использовать как источник правды.

## `src/main.py`

Точка сборки приложения:

- подключает CORS;
- регистрирует routers;
- на startup создаёт схемы SQLite;
- создаёт admin-пользователя;
- запускает неблокирующую проверку recent sync, если последнее обновление старше
  24 часов.

Файл должен оставаться тонким. Новую бизнес-логику сюда не добавлять.

## `src/config.py`, `src/logger.py`, `src/models.py`

- `config.py` читает `.env` и возвращает `Settings`.
- `logger.py` настраивает логирование.
- `models.py` содержит backend `TypedDict`-модели, прежде всего `Anime`.

Новые переменные окружения документируй в `.env.example`, если он используется.

## `src/routers/`

HTTP-слой. Роутеры должны быть тонкими и делегировать работу в `services/`.

- `anime.py` — каталог, bulk-каталог, detail, related, episodes, studio/dubbing
  lists. Горячие catalog/detail/studio paths читают SQLite.
- `player.py` — Kodik player endpoints, schedule, studios.
  Player endpoints могут ходить во внешний Kodik, потому что данные плеера
  (iframe-ссылка, озвучки, названия серий) не лежат в `anime_catalog`.
- `auth.py` — register/login/logout/me/avatar/change-password/change-name.
- `comments.py` — комментарии, ответы, голоса, edit/delete с server-side auth.
- `library.py` — watchlist пользователя.
- `system.py` — health, image-proxy, public users/avatars.
- `static_pages.py` — публичная отдача статических страниц (agreement/
  privacy/copyright) из SQLite.
- `seo.py` — `/sitemap.xml` (статические страницы + все тайтлы из каталога).
- `admin/` — пакет admin-роутеров: `auth.py` (проверка сессии + `require_admin`),
  `users.py`, `user_actions.py` (роль/бан/сброс пароля), `static_pages.py` (CMS),
  `audit.py` (журнал), `comments.py` (модерация), `sync.py` (ручной sync).
- `internal_catalog.py` — внутренний cron endpoint `/internal/catalog/refresh`.

Новые endpoints добавляй в существующий router по домену. Если домен новый,
создай отдельный router и подключи его в `main.py`.

## `src/db/`

Низкоуровневый доступ к SQLite. Здесь не должно быть внешних HTTP-вызовов.

- `anime_catalog.py` — схема `anime_catalog`, upsert, row mapping,
  `mark_kodik_availability` (флаг `has_kodik`: NULL/0/1).
- `anime_catalog_queries.py` — фильтрация, сортировка, pagination, stats.
  Все листинги скрывают `has_kodik = 0` (предикат-константа `_KODIK_VISIBLE`).
- `anime_catalog_lookup.py` — точечные быстрые lookups: by ids, by studio,
  upcoming schedule rows (тоже с фильтром `has_kodik`).
- `cache.py` — TTL cache table `api_cache` для provider responses.
- `sync_state.py` — служебное состояние sync/locks.
- `static_pages.py` — таблица статических страниц (CMS, связана с
  `static_page_content/`).
- `user/` — пакет данных пользователей: `users.py` (users/sessions/хеши),
  `comments.py` (comments/votes/`parent_id`-дерево, рекурсивное удаление),
  `watchlist.py`, `library.py`.
- `admin/` — пакет admin-запросов: `users.py` (роль/бан), `audit.py` (журнал),
  `comments.py` (список с автором/аниме для модерации).

SQL писать только параметризованно. Sync никогда не удаляет строки из
`anime_catalog`, только upsert.

## `src/services/`

Бизнес-логика и интеграции.

- `catalog/` — пакет каталога: `catalog.py` (публичные catalog/detail/studio/
  related, SQLite-first), `catalog_related.py` (обогащение related),
  `catalog_filter.py` (серверная фильтрация/сортировка), `catalog_refresh.py`
  (cron-обёртка: lock/timeout/summary).
- `user/` — пакет пользователя: `auth.py` (регистрация/login/sessions/scrypt/
  admin seed), `avatars.py` (WEBP 256×256), `library.py`, `watchlist.py`.
- `content.py` — episode metadata: локальный catalog count + Kodik player data.
- `schedule.py` — расписание из `next_episode_at`.
- `seo.py` — `anime_slug` (зеркало фронтового `createAnimeSlug`) + билдер
  sitemap XML; `anime_slug` обязан совпадать с фронтом.
- `image_proxy.py` — серверный проксик Shikimori-изображений (allow-list, без
  редиректов).
- `yummyanime.py` — fallback-описания, только в sync/enrichment, не на горячем path.

## Provider Packages

`services/shikimori/`:

- `http.py`, `rate_limit.py` — общий транспорт и лимиты.
- `fields.py`, `normalizers.py`, `helpers.py`, `constants.py` — GQL fields,
  нормализация и утилиты.
- `sync.py`, `sync_sources.py` — основной refresh каталога в SQLite.
- `details.py`, `catalog.py`, `ongoing.py`, `related.py`, `studio.py`,
  `posters.py`, `legacy_bulk.py` — provider-specific reads/fallbacks.

`services/kodik/`:

- `client.py` — Kodik search/list transport + `iter_kodik_shikimori_ids`
  (полный обход `/list` с пагинацией; `_next_token` берёт `next` из URL).
- `normalize.py` — player/translation normalization.
- `dubbing.py` — ids по translation_id.
- `availability.py` — `refresh_kodik_availability`: обход `/list` → проставить
  `has_kodik` всему каталогу. Пишет флаги только при полном успехе и непустом
  наборе (иначе каталог не прячется).

Provider code допустим в sync/player paths. Не подключай provider calls в
catalog/detail/studio страницы, если данные уже должны лежать в SQLite.

## `src/scripts/`

- `sync_shikimori.py` — CLI для `full`, `recent`, `kodik` (обновить флаги
  `has_kodik`), `status`.

Используй для ручного наполнения/проверки каталога.

## Data Flow

1. Cron или CLI запускает Shikimori sync.
2. Sync последовательно ходит во внешние API и upsert-ит `anime_catalog`.
3. Frontend читает каталог/detail/studio/schedule через backend из SQLite.
4. Player endpoints отдельно получают player data из Kodik.
5. После sync (и по CLI `kodik`) проход Kodik `/list` проставляет `has_kodik`;
   листинги/поиск/sitemap скрывают тайтлы без озвучки (`has_kodik = 0`).
6. Image proxy проксирует защищённые изображения (allow-list хостов, без
   редиректов), но URL постеров хранится в DB.

## Verification

Из `app/backend`:

- `python -m compileall src -q`
- `python -c "from src.main import app"`
- `python -m pytest tests -q`
- `python -m src.scripts.sync_shikimori status`
