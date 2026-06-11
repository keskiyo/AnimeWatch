# AnimeWatch — документация проекта

Сайт для просмотра аниме: каталог с фильтрами, страница тайтла с плеером Kodik,
расписание серий, поиск. Данные — Shikimori (каталог/детали) + Kodik (плеер/озвучки)

- YummyAnime (запасные описания).

---

## 1. Стек

| Слой             | Технологии                                                                   |
| ---------------- | ---------------------------------------------------------------------------- |
| Backend          | Python 3.12+, FastAPI, Uvicorn, httpx, SQLite (stdlib `sqlite3`)             |
| Frontend         | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, Axios            |
| Источники данных | Shikimori GraphQL (основной) + REST (вспомогательный), Kodik API, YummyAnime |

Запуск dev-окружения: `npm run dev` (или `bun run dev`) в `app/backend` и `app/frontend`.
Backend слушает `http://127.0.0.1:3001`, frontend — `http://localhost:5173`.

---

## 2. Структура репозитория

```
app/
├── backend/
│   ├── .env                    # токены и настройки (НЕ коммитить)
│   ├── data/anime-viewer.db    # SQLite: каталог + кеши + watchlist
│   └── src/
│       ├── main.py             # сборка приложения: CORS, роутеры, startup
│       ├── config.py           # Settings из .env
│       ├── models.py           # TypedDict Anime
│       ├── routers/            # HTTP-слой (тонкие обработчики)
│       │   ├── anime.py        #   /api/anime*, /api/animes/*, studio, dubbing
│       │   ├── player.py       #   /api/player/*, /api/schedule, /api/studios
│       │   ├── library.py      #   watchlist, progress, settings, notifications
│       │   ├── system.py       #   /api/health, /api/image-proxy
│       │   └── admin_sync.py   #   /admin/sync/shikimori/* (full/recent/status)
│       ├── db/
│       │   ├── anime_catalog.py         # ПОСТОЯННАЯ таблица каталога: схема, upsert
│       │   ├── anime_catalog_queries.py # чтение: фильтры, сортировка, страницы, stats
│       │   ├── sync_state.py            # состояние синхронизаций (key-value)
│       │   ├── cache.py                 # TTL-кеш api_cache
│       │   └── library.py               # watchlist/progress/settings store
│       ├── services/
│       │   ├── shikimori/      # слой данных Shikimori (см. §4)
│       │   ├── kodik/          # слой данных Kodik (client/normalize/dubbing)
│       │   ├── catalog.py      # сервисы каталога для роутеров
│       │   ├── content.py      # episodes, schedule, studios
│       │   ├── library.py      # сервисы watchlist/settings
│       │   └── yummyanime.py   # запасные описания
│       └── scripts/
│           └── sync_shikimori.py  # CLI: full / recent / status
└── frontend/
    └── src/
        ├── api/                # тонкие API-клиенты (по доменам)
        │   ├── client.ts, fallback.ts
        │   ├── catalogApi.ts, animeApi.ts, playerApi.ts, scheduleApi.ts
        │   └── watchlistApi.ts, settingsApi.ts, notificationsApi.ts
        ├── app/App.tsx         # роуты
        ├── pages/              # HomePage, CatalogPage, AnimePage, StudioPage, DubbingPage…
        ├── components/         # переиспользуемые (PosterImage, AnimeGridSection, NumberInput…)
        ├── features/           # по фичам: catalog/, animepage/, header/, home/, ongoing/, studio/
        │   └── <feature>/components + hooks
        ├── types/              # ВСЕ shared-типы (anime, animePage, catalog, search, studio)
        ├── utils/              # чистые функции и константы
        └── styles/index.css    # Tailwind-тема (тёмная, единственная)
```

---

## 3. Поток данных каталога (главное!)

```
Shikimori ──(sync, вручную/еженедельно)──▶ SQLite anime_catalog ──▶ /api/anime/bulk ──▶ фронт
```

1. **Постоянная таблица `anime_catalog`** в `./data/anime-viewer.db` — источник
   правды каталога. Переживает рестарты. Записи только upsert'ятся, никогда не удаляются.
2. **`/api/anime/bulk`** читает ТОЛЬКО из этой таблицы — Shikimori при обычной
   работе сайта не дёргается. Пустая таблица → `{"data": [], "needs_sync": true}`.
3. **Фронт** (`useAnimeCache`) грузит bulk один раз за сессию, дальше фильтры,
   сортировка и поиск работают на клиенте мгновенно.

### Синхронизация

| Тип        | Что делает                                                                           | Запуск                                                                                              |
| ---------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Full**   | Все аниме 1990 → сегодня: по годам, по сезонам (REST ids → GQL детали пачками по 50) | `python -m src.scripts.sync_shikimori full` или `POST /admin/sync/shikimori/full`. Один раз, ~1–3 ч |
| **Recent** | Сезоны 2026+ плюс ВСЕ ongoing/anons (даже старых лет)                                | `... recent` или `POST .../recent`. Автоматически раз в 24 часа при старте бекенда                  |
| **Status** | count, min/max год, by_year, sync_state                                              | `... status` или `GET .../status`                                                                   |

Лимиты Shikimori (90 rpm): все sync-запросы идут последовательно через
`sync_rate_limiter` (1 запрос / 0.85 с ≈ 70 rpm). Обычные запросы — через
`gql_throttle`/`rest_throttle`. Прогресс пишется после каждого года — прерванный
sync безопасно дозапускается.

Безопасность admin-endpoints: заголовок `X-Admin-Token` = `ADMIN_SYNC_TOKEN` из
`.env`; если токен не задан — доступ только с localhost.

---

## 4. Backend: модули Shikimori и Kodik

`services/shikimori/` (каждый файл — одна зона ответственности):

| Файл                                                                    | Назначение                                                                         |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `constants.py`                                                          | маппинги статусов/сортировок/жанров, GQL OrderEnum (snake_case!)                   |
| `fields.py`                                                             | наборы GQL-полей (detail / list / sync)                                            |
| `rate_limit.py`                                                         | `Throttle` — глобальный мин-интервал между запросами                               |
| `http.py`                                                               | `fetch_gql`/`fetch_rest_json` с ретраями (429 уважает Retry-After), `to_gql_order` |
| `normalizers.py`                                                        | сырой GQL/REST → `Anime`; merge ролей/скриншотов                                   |
| `details.py`                                                            | страница тайтла: GQL + REST roles/screenshots                                      |
| `catalog.py`                                                            | постраничный REST-каталог (поиск в шапке)                                          |
| `sync_sources.py`                                                       | сбор id по сезонам/статусам, GQL-детали пачками                                    |
| `sync.py`                                                               | оркестрация full/recent/weekly + `fetch_shikimori_bulk_catalog` (из БД)            |
| `ongoing.py` / `studio.py` / `related.py` / `posters.py` / `helpers.py` | онгоинги, студии, связанные, добивка постеров, утилиты                             |
| `legacy_bulk.py`                                                        | старый прямой GQL-bulk; включается только `ALLOW_SHIKIMORI_BULK_FALLBACK=true`     |

`services/kodik/`: `client.py` (HTTP /search и /list, кеш, проверка хостов),
`normalize.py` (плеер, список озвучек, названия серий), `dubbing.py` (id по
команде озвучки), `__init__.py` (`get_kodik_player`, `get_kodik_search_results`).

---

## 5. Frontend: ключевые механизмы

- **`useAnimeCache`** — модульный кеш сессии: bulk-каталог грузится один раз,
  компоненты подписываются. Фоллбек на постраничную загрузку, если bulk пуст.
- **`useAnimeCatalog`** — фильтры+сортировка на клиенте
  (чистые функции в `utils/catalogClientFilter.ts`). Анонсы всегда в конце.
- **`useCatalogFilters`** — фильтры в URL search-params (переживают reload);
  маппинги в `utils/catalogFilterMaps.ts`.
- **Плеер** (`features/animepage`): `useAnimePlayerState` — активная серия,
  доступные озвучки для неё (фильтр по `episodesCount`), автопереключение
  озвучки, ссылка iframe = ссылка озвучки + `?episode=N` (`utils/kodikLink.ts`).
- **`PosterImage`** — единственный способ рендерить постеры: proxy + плейсхолдер
  с инициалами + ретраи при ошибке загрузки.
- **Фоллбеки**: нет данных из API → «Неизвестно». Фейковые данные запрещены.

---

## 6. .env (app/backend/.env)

```env
DATABASE_PATH=./data/anime-viewer.db
KODIK_API_KEY=...                  # токен Kodik
SHIKIMORI_BASE_URL=https://shikimori.one
SHIKIMORI_GQL_ENDPOINT=https://shikimori.io/api/graphql
ADMIN_SYNC_TOKEN=                  # пусто = admin sync только с localhost
ALLOW_SHIKIMORI_BULK_FALLBACK=false
BACKEND_URL=http://127.0.0.1:3001  # нужен только cron-задаче
CATALOG_REFRESH_TOKEN=             # секрет для /internal/catalog/refresh (503 если пуст)
CATALOG_REFRESH_TIMEOUT_MS=7200000 # таймаут refresh-задачи (2 часа)
```

---

## 6.1 Автообновление каталога (cron, без Docker)

Раз в день в 04:00 системный cron дёргает защищённый endpoint, который
запускает recent-sync (свежие сезоны + ongoing/anons) в фоне.

**Endpoints** (требуют `Authorization: Bearer $CATALOG_REFRESH_TOKEN`;
без настроенного токена отвечают 503 всем):

| Endpoint | Ответ |
|---|---|
| `POST /internal/catalog/refresh` | `202 {"status":"started"}`; `409` если уже идёт; `401/403` без/с неверным токеном |
| `GET /internal/catalog/refresh/status` | lastRunAt, lastSuccessAt, currentlyRunning, lastStatus, lastSummary, lastError |

**Ручной запуск:**
```bash
curl -fsS -X POST "$BACKEND_URL/internal/catalog/refresh" \
  -H "Authorization: Bearer $CATALOG_REFRESH_TOKEN"
```

**Установка cron** (шаблон: `deploy/cron/catalog-refresh.cron.example`):
```bash
crontab deploy/cron/catalog-refresh.cron.example   # или crontab -e и вставить строку
crontab -l                                         # проверить
# отключить: crontab -e → удалить/закомментировать строку refresh
```
Логи cron: `/var/log/catalog-refresh.log`. Логи задачи — в логах бекенда
(`catalog_refresh_started/finished/failed/skipped_already_running`).

**Защиты** (`services/catalog_refresh.py`):
- DB-lock `catalog-refresh-lock` с TTL 2 ч (работает между процессами;
  освобождается в `finally`, после краша истекает сам) → параллельные запуски невозможны;
- таймаут `CATALOG_REFRESH_TIMEOUT_MS` → зависшая задача завершается как failed;
- сам sync **никогда не удаляет** записи (только upsert по PK id) → пустой/упавший
  ответ Shikimori не трогает каталог; 429/5xx ретраятся с backoff (×3);
- summary (added/updated/status/errors) сохраняется в sync_state и виден в status.

**Если refresh падает**: смотри `lastError` в status-endpoint и лог бекенда;
обычно это 429 Shikimori (задача дозапустится завтра, данные целы) или
неверный токен в cron.

---

## 7. Проверки

| Команда                                       | Что                |
| --------------------------------------------- | ------------------ |
| `python -m compileall src -q` (backend)       | синтаксис          |
| `python -c "from src.main import app"`        | сборка приложения  |
| `python -m src.scripts.sync_shikimori status` | состояние каталога |
| `tsc --noEmit` (frontend)                     | типы               |
| `vite build`                                  | прод-сборка        |

---
