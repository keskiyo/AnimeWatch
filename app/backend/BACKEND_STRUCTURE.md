# Backend Structure

Документ описывает, как устроена папка `app/backend` и куда добавлять новый код.
Подробная архитектура проекта также описана в корневом `Documentations.md`

## Корень `app/backend`

- `src/` — основной код FastAPI-приложения.
- `tests/` — pytest-тесты. В текущем gitignore папка может быть исключена,
  поэтому перед добавлением новых тестов проверь `git check-ignore`.
- `data/` — локальные runtime-данные (аватары). Не хранить здесь код.
- `dist/`, `node_modules/`, `.pytest_cache/`, `__pycache__/` — сгенерированные
  артефакты, не использовать как источник правды.

## `src/main.py`

Точка сборки приложения:

- подключает CORS;
- регистрирует routers;
- на startup (lifespan) открывает Motor-клиент и вызывает `ensure_indexes(db)`;
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
  lists. Горячие catalog/detail/studio paths читают Mongo.
- `player.py` — Kodik player endpoints, schedule, studios.
  Player endpoints могут ходить во внешний Kodik, потому что данные плеера
  (iframe-ссылка, озвучки, названия серий) не лежат в `anime_catalog`.
- `auth.py` — register/login/logout/me/avatar/change-password/change-name.
- `comments.py` — комментарии, ответы, голоса, edit/delete с server-side auth.
- `library.py` — watchlist пользователя.
- `system.py` — health, image-proxy, public users/avatars.
- `static_pages.py` — публичная отдача статических страниц (agreement/
  privacy/copyright) из Mongo.
- `seo.py` — `/sitemap.xml` (статические страницы + все тайтлы из каталога).
- `admin/` — пакет admin-роутеров: `auth.py` (проверка сессии + `require_admin`),
  `users.py`, `user_actions.py` (роль/бан/сброс пароля), `static_pages.py` (CMS),
  `audit.py` (журнал), `comments.py` (модерация), `sync.py` (ручной sync).
- `internal_catalog.py` — внутренний cron endpoint `/internal/catalog/refresh`.

Новые endpoints добавляй в существующий router по домену. Если домен новый,
создай отдельный router и подключи его в `main.py`.

## `src/db/`

Низкоуровневый доступ к MongoDB (Motor, async). Здесь не должно быть внешних
HTTP-вызовов. Все функции — `async def`.

- `mongo.py` — единый `AsyncIOMotorClient` (создаётся лениво), `get_db()`,
  `to_oid()` (str→ObjectId), `set_client()`/`close_client()` (тесты подменяют
  на mongomock-motor).
- `indexes.py` — `ensure_indexes(db)`: индексы коллекций + TTL-индексы
  (`sessions.expires_at`, `cache.expires_at`), unique `users.email_lower`.
- `anime_catalog.py` — коллекция `anime` (`_id` = shikimori id, int), upsert
  (`bulk_write`), doc↔Anime mapping, `mark_kodik_availability` (поле `has_kodik`).
- `anime_catalog_queries.py` — фильтрация, сортировка, pagination, stats
  (aggregate). Все листинги скрывают `has_kodik = 0` (`_KODIK_VISIBLE` фильтр).
- `anime_catalog_lookup.py` — точечные lookups: by ids, by studio,
  upcoming schedule rows (тоже с фильтром `has_kodik`).
- `cache.py` — коллекция `cache` (TTL) для provider responses.
- `sync_state.py` — коллекция `sync_state` (служебное состояние sync/locks).
- `static_pages.py` — коллекция `static_pages` (`_id` = slug; CMS, связана с
  `static_page_content/`).
- `user/` — пакет данных пользователей: `users.py` (users/sessions/scrypt,
  `ObjectId`), `comments.py` (коллекция `comments`, embedded `votes`,
  `parent_id`-дерево, рекурсивное удаление обходом), `watchlist.py`,
  `library.py` (глобальные progress/app_kv/notifications — известный долг).
- `admin/` — пакет admin-запросов: `users.py` (роль/бан), `audit.py` (журнал),
  `comments.py` (список с автором/аниме для модерации).

Sync никогда не удаляет документы из `anime`, только upsert.

## `src/services/`

Бизнес-логика и интеграции.

- `catalog/` — пакет каталога: `catalog.py` (публичные catalog/detail/studio/
  related, Mongo-first), `catalog_related.py` (обогащение related),
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
- `sync.py`, `sync_sources.py` — основной refresh каталога в Mongo.
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
catalog/detail/studio страницы, если данные уже должны лежать в Mongo.

## `src/scripts/`

- `sync_shikimori.py` — CLI для `full`, `recent`, `kodik` (обновить флаги
  `has_kodik`), `status`.
- `migrate_sqlite_to_mongo.py` — одноразовый перенос юзер-данных из старой
  SQLite в Mongo (каталог не переносит — его наполняет ресинк).

Используй для ручного наполнения/проверки каталога.

## Data Flow

1. Cron или CLI запускает Shikimori sync.
2. Sync последовательно ходит во внешние API и upsert-ит коллекцию `anime`.
3. Frontend читает каталог/detail/studio/schedule через backend из Mongo.
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
