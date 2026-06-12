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
- `player.py` — Kodik/AnimeGO player endpoints, schedule, player providers.
  Player/stream endpoints могут ходить во внешние сервисы, потому что stream URL
  не лежит в `anime_catalog`.
- `auth.py` — register/login/logout/me/avatar/change-password/change-name.
- `comments.py` — комментарии, ответы, голоса, edit/delete с server-side auth.
- `library.py` — watchlist пользователя.
- `system.py` — health, image-proxy, public users/avatars.
- `admin_sync.py` — ручной sync/admin операции.
- `internal_catalog.py` — внутренний cron endpoint `/internal/catalog/refresh`.

Новые endpoints добавляй в существующий router по домену. Если домен новый,
создай отдельный router и подключи его в `main.py`.

## `src/db/`

Низкоуровневый доступ к SQLite. Здесь не должно быть внешних HTTP-вызовов.

- `anime_catalog.py` — схема `anime_catalog`, upsert, row mapping.
- `anime_catalog_queries.py` — фильтрация, сортировка, pagination, stats.
- `anime_catalog_lookup.py` — точечные быстрые lookups: by ids, by studio,
  upcoming schedule rows.
- `cache.py` — TTL cache table `api_cache` для provider responses.
- `sync_state.py` — служебное состояние sync/locks.
- `users.py` — users/sessions/password hashes.
- `comments.py` — comments/votes/replies.
- `library.py`, `watchlist.py` — watchlist storage.

SQL писать только параметризованно. Sync никогда не удаляет строки из
`anime_catalog`, только upsert.

## `src/services/`

Бизнес-логика и интеграции.

- `catalog.py` — публичные catalog/detail/studio/related операции для routers.
  Catalog, bulk, detail и studio должны оставаться SQLite-first/local-only на
  пользовательском запросе.
- `catalog_related.py` — обогащает related карточки локальными полями из
  `anime_catalog`.
- `schedule.py` — строит расписание из `next_episode_at` в SQLite.
- `content.py` — episode metadata: локальный catalog count + Kodik player data.
- `catalog_refresh.py` — cron refresh wrapper: lock, timeout, status summary.
- `auth.py` — регистрация, login, sessions, scrypt password hashes, admin seed.
- `avatars.py` — upload validation и WEBP 256x256.
- `library.py`, `watchlist.py` — watchlist бизнес-операции.
- `yummyanime.py` — fallback description provider, использовать только в sync или
  controlled enrichment, не на горячем frontend path.

## Provider Packages

`services/shikimori/`:

- `http.py`, `rate_limit.py` — общий транспорт и лимиты.
- `fields.py`, `normalizers.py`, `helpers.py`, `constants.py` — GQL fields,
  нормализация и утилиты.
- `sync.py`, `sync_sources.py` — основной refresh каталога в SQLite.
- `details.py`, `catalog.py`, `ongoing.py`, `related.py`, `studio.py`,
  `posters.py`, `legacy_bulk.py` — provider-specific reads/fallbacks.

`services/kodik/`:

- `client.py` — Kodik search/list transport.
- `normalize.py` — player/translation normalization.
- `dubbing.py` — ids по translation_id.

`services/animego/`:

- `client.py`, `voices.py`, `resolver.py`, `normalize.py` — backup stream
  provider.

Provider code допустим в sync/player paths. Не подключай provider calls в
catalog/detail/studio страницы, если данные уже должны лежать в SQLite.

## `src/scripts/`

- `sync_shikimori.py` — CLI для `full`, `recent`, `status`.

Используй для ручного наполнения/проверки каталога.

## Data Flow

1. Cron или CLI запускает Shikimori sync.
2. Sync последовательно ходит во внешние API и upsert-ит `anime_catalog`.
3. Frontend читает каталог/detail/studio/schedule через backend из SQLite.
4. Player endpoints отдельно получают stream/player data из Kodik/AnimeGO.
5. Image proxy проксирует защищённые изображения, но URL постеров хранится в DB.

## Verification

Из `app/backend`:

- `python -m compileall src -q`
- `python -c "from src.main import app"`
- `python -m pytest tests -q`
- `python -m src.scripts.sync_shikimori status`
