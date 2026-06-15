# AnimeWatch — документация проекта

Сайт для просмотра аниме: каталог с фильтрами, страница тайтла с плеером Kodik,
расписание серий, поиск, аккаунты с watchlist, комментарии/отзывы, админ-панель.
Данные — Shikimori (каталог/детали) + Kodik (плеер/озвучки) + YummyAnime
(запасные описания).

Плеер на сайте один — **Kodik** (iframe-embed). Резервные плееры (aniboom/cvh)
были удалены; вся player-логика идёт только через Kodik.

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
│       │   ├── player.py       #   /api/player/kodik/*, /api/schedule, /api/studios
│       │   ├── library.py      #   watchlist, progress, settings
│       │   ├── system.py       #   /api/health, /api/image-proxy, public users/avatars
│       │   ├── auth.py         #   register/login/logout/me/avatar/password/name
│       │   ├── comments.py     #   комментарии/отзывы: list/create/vote/edit/delete
│       │   ├── static_pages.py #   публичные статические страницы из SQLite
│       │   ├── seo.py          #   /sitemap.xml (канонические URL для роботов)
│       │   ├── admin_auth.py   #   проверка admin-сессии (зависимость)
│       │   ├── admin_users.py / admin_user_actions.py  # управление юзерами
│       │   ├── admin_static_pages.py  # CMS статических страниц
│       │   ├── admin_audit.py  #   журнал admin-действий
│       │   ├── admin_sync.py   #   /admin/sync/shikimori/* (full/recent/status)
│       │   └── internal_catalog.py    # cron /internal/catalog/refresh
│       ├── db/
│       │   ├── anime_catalog.py         # ПОСТОЯННАЯ таблица каталога: схема, upsert
│       │   ├── anime_catalog_queries.py # чтение: фильтры, сортировка, страницы, stats
│       │   ├── anime_catalog_lookup.py  # точечные lookups (by ids/studio/schedule)
│       │   ├── sync_state.py            # состояние синхронизаций (key-value)
│       │   ├── cache.py                 # TTL-кеш api_cache
│       │   ├── users.py                 # users/sessions/scrypt-хеши
│       │   ├── admin_users.py / admin_audit.py  # admin-запросы + журнал
│       │   ├── comments.py              # комментарии/голоса/ответы
│       │   ├── static_pages.py          # таблица статических страниц (CMS)
│       │   └── library.py / watchlist.py  # watchlist/progress/settings store
│       ├── services/
│       │   ├── shikimori/      # слой данных Shikimori (см. §4)
│       │   ├── kodik/          # слой данных Kodik (client/normalize/dubbing)
│       │   ├── catalog.py / catalog_filter.py / catalog_related.py  # каталог
│       │   ├── content.py / schedule.py  # episodes, расписание, студии
│       │   ├── auth.py / avatars.py      # аккаунты, сессии, WEBP-аватары
│       │   ├── library.py / watchlist.py # сервисы watchlist/settings
│       │   ├── catalog_refresh.py        # cron-обёртка (lock/timeout/summary)
│       │   ├── seo.py                     # anime_slug + билдер sitemap.xml
│       │   └── yummyanime.py             # запасные описания
│       └── scripts/
│           └── sync_shikimori.py  # CLI: full / recent / status
└── frontend/
    └── src/
        ├── api/                # тонкие API-клиенты (по доменам)
        │   ├── client.ts, fallback.ts
        │   ├── catalogApi.ts, animeApi.ts, playerApi.ts, scheduleApi.ts
        │   ├── watchlistApi.ts, settingsApi.ts, authApi.ts
        │   └── commentsApi.ts, usersApi.ts, adminApi.ts, pagesApi.ts
        ├── app/App.tsx         # роуты + Header/Footer + ToastContainer
        ├── pages/              # home, anime (catalog/ongoing/detail), studio,
        │                       #   dubbing, profile, admin, footer, not-found
        ├── components/         # переиспользуемые (PosterImage, AnimeGridSection, NumberInput…)
        ├── features/           # по фичам: catalog/, animepage/, header/, home/,
        │                       #   ongoing/, studio/, profile/, auth/, admin/, static-pages/
        │   └── <feature>/components + hooks
        ├── types/              # ВСЕ shared-типы (anime, animePage, catalog, search,
        │                       #   studio, auth, reviews, watchlist, admin, staticPage)
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
4. **Фильтр по озвучке Kodik.** В каталоге/поиске/рейле/студиях/sitemap
   показываются ТОЛЬКО тайтлы с озвучкой Kodik. Это флаг `has_kodik` в
   `anime_catalog` (`NULL` = не проверено → видно; `1` = есть → видно; `0` =
   проверено, нет → скрыто). Прячется только `has_kodik = 0`. Прямая ссылка
   `/api/animes/{id}` на скрытый тайтл всё равно работает (watchlist/старые
   ссылки не ломаются). Флаг проставляет проход по Kodik `/list` (см. ниже).

### Синхронизация

| Тип        | Что делает                                                                           | Запуск                                                                                              |
| ---------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Full**   | Все аниме 1990 → сегодня: по годам, по сезонам (REST ids → GQL детали пачками по 50) | `python -m src.scripts.sync_shikimori full` или `POST /admin/sync/shikimori/full`. Один раз, ~1–3 ч |
| **Recent** | Сезоны 2026+ плюс ВСЕ ongoing/anons (даже старых лет)                                | `... recent` или `POST .../recent`. Автоматически раз в 24 часа при старте бекенда                  |
| **Kodik**  | Обход Kodik `/list` (пагинация), проставляет `has_kodik` всему каталогу             | `... kodik` (вручную). Также авто в конце full/recent sync                                          |
| **Status** | count, min/max год, by_year, sync_state                                              | `... status` или `GET .../status`                                                                   |

Лимиты Shikimori (90 rpm): все sync-запросы идут последовательно через
`sync_rate_limiter` (1 запрос / 0.85 с ≈ 70 rpm). Обычные запросы — через
`gql_throttle`/`rest_throttle`. Прогресс пишется после каждого года — прерванный
sync безопасно дозапускается. **Kodik-проход** пишет флаги только при ПОЛНОМ
успешном обходе и непустом наборе — сбой сети не прячет каталог.

Безопасность admin-endpoints (`/admin/sync/shikimori/*`): обязателен заголовок
`X-Admin-Token` = `ADMIN_SYNC_TOKEN` (timing-safe сравнение); без токена эндпоинт
отключён (403) — IP не доверяется (за прокси `request.client.host` подделываем).

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

`services/kodik/`: `client.py` (HTTP /search и /list, кеш, проверка хостов,
`iter_kodik_shikimori_ids` — полный обход /list), `normalize.py` (плеер, список
озвучек, названия серий), `dubbing.py` (id по команде озвучки),
`availability.py` (`refresh_kodik_availability` — проставляет `has_kodik` всему
каталогу из обхода /list), `__init__.py` (`get_kodik_player`,
`get_kodik_search_results`).

---

## 5. Frontend: ключевые механизмы

- **`useAnimeCache`** — zustand-стор сессии: bulk-каталог грузится один раз,
  компоненты подписываются. Общий клиентский стейт — на zustand (`useAuthUser`,
  `useAnimeCache`); локальный — `useState`. Redux не используется.
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

## 5.1 Аккаунты, комментарии, админка, статические страницы

- **Аккаунты** (`services/auth.py`, `db/users.py`): регистрация/логин, scrypt-хеши
  паролей, сессии в SQLite (30 дней). Токен хранится в localStorage, юзер
  восстанавливается на загрузке через `useAuthUser`. Открыть модалку логина
  откуда угодно — `openAuthModal()` (`features/auth/authModalBus`). Аватары
  оптимизируются на сервере (256×256 WEBP, `data/avatars/`), отдаются публично
  на `/api/avatars/{user_id}`; относительные URL — через `resolveAvatarUrl()`.
  Admin-пользователь создаётся один раз при старте (`seed_admin_user`,
  `admin/admin`; сброс — `reset_password_cli`).
- **Watchlist/профиль** (`routers/library.py`, `features/profile/`): статусы
  просмотра, прогресс, настройки; свой профиль `/profile`, публичный
  `/profile/:userId` (без email).
- **Комментарии/отзывы** (`routers/comments.py`, `db/comments.py`): список,
  создание, голоса (лайки), ответы, edit/delete. Все мутации перепроверяют
  сессию и владельца на сервере (автор правит своё; админ может удалять любое,
  но не редактировать).
- **Админ-панель** (`/admin`, только для роли admin; `features/admin/`,
  `routers/admin_*`): управление пользователями (роль, бан, сброс пароля),
  CMS статических страниц, журнал admin-действий (`admin_audit`). Доступ
  проверяется на сервере через `admin_auth`.
- **Статические страницы** (`routers/static_pages.py` + `admin_static_pages.py`,
  `db/static_pages.py`): тексты agreement/privacy/copyright хранятся в SQLite,
  редактируются в админке, отдаются публично и рендерятся через
  `features/static-pages/StaticPageView` + `pagesApi`. БД — источник правды:
  дефолты из `db/static_page_content/*.txt` заливаются один раз (seed,
  `INSERT OR IGNORE`), дальше существующие строки не перетираются.

Безопасность: auth-проверки только на сервере (скрытие кнопки на клиенте — UX,
не защита). Email в публичный профиль не отдаётся.

---

## 5.2 SEO

Сайт — SPA (CSR), поэтому SEO построено на канонизации путей и динамических
мета-тегах:

- **`utils/pageMeta.ts` → `setPageMeta(...)`** на каждой странице ставит `title`,
  `description` (очищается от BBCode/HTML и обрезается до ~160), `<link
  rel="canonical">`, `robots`, Open Graph и Twitter Card. Canonical по
  умолчанию = `origin + pathname` (без query) — фильтры каталога (`/anime?...`)
  схлопываются в `/anime`.
- **Канонический URL тайтла**: `AnimePage` редиректит любой slug на
  `{id}-{slug}` (`createAnimeSlug`), чтобы у каждого тайтла был один URL и не
  было дублей для роботов.
- **`noindex`**: `/admin`, `/profile`, `/profile/:id`, 404.
- **JSON-LD** (`utils/structuredData.ts`): для тайтла `Movie`/`TVSeries` +
  `BreadcrumbList`.
- **`robots.txt`** (`frontend/public/robots.txt`): запрет `/admin`, `/profile`
  и query-URL; ссылка на `/sitemap.xml`.
- **`/sitemap.xml`** (бэк, `routers/seo.py` + `services/seo.py`): статические
  страницы + все тайтлы из `anime_catalog`. Базовый origin — `SITE_URL` или
  выводится из запроса (`request.base_url`). `anime_slug` в Python зеркалит
  фронтовый `createAnimeSlug`, поэтому URL в sitemap совпадают с каноническими.
- **Деплой**: если SPA и API на разных хостах — настрой проксирование
  `/sitemap.xml` на бэкенд (или генерируй статически) и задай `SITE_URL`.

> Открытый пункт (большая задача): для не-Google ботов и соцскрейперов
> (они не исполняют JS) мета/OG видны только при SSR/prerender. Рекомендуется
> отдельным этапом добавить prerender статических роутов или edge-prerender.

---

## 6. .env (app/backend/.env)

```env
DATABASE_PATH=./data/anime-viewer.db
KODIK_API_KEY=...                  # токен Kodik
SHIKIMORI_BASE_URL=https://shikimori.one
SHIKIMORI_GQL_ENDPOINT=https://shikimori.io/api/graphql
YUMMYANIME_PRIVATE_TOKEN=          # запасные описания; без токена источник пропускается
YUMMYANIME_PUBLIC_TOKEN=           # (хардкод-фолбэка больше нет)
ADMIN_SYNC_TOKEN=                  # ОБЯЗАТЕЛЕН для /admin/sync/*; пусто = эндпоинт 403
ALLOW_SHIKIMORI_BULK_FALLBACK=false
BACKEND_URL=http://127.0.0.1:3001  # нужен только cron-задаче
CATALOG_REFRESH_TOKEN=             # секрет для /internal/catalog/refresh (503 если пуст)
CATALOG_REFRESH_TIMEOUT_MS=7200000 # таймаут refresh-задачи (2 часа)
SITE_URL=                          # публичный origin для абсолютных URL в sitemap.xml
                                   # (пусто = берётся из запроса)
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
