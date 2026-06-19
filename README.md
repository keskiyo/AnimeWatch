# AnimeWatch

Онлайн-кинотеатр аниме: каталог с фильтрами и поиском, страница тайтла с
плеером Kodik (выбор озвучки и серии), расписание эпизодов, аккаунты со списком
просмотра, комментарии/отзывы и админ-панель.

Данные: **Shikimori** (каталог, детали, постеры — GraphQL) + **Kodik**
(плеер, озвучки, названия серий) + **YummyAnime** (запасные описания).
Каталог хранится в MongoDB и не дёргает внешние API при обычной работе.

## Возможности

- Каталог 1990+ с фильтрами: жанры, тип, статус, год, возрастной рейтинг, количество серий
- В каталоге/поиске показываются только тайтлы с озвучкой Kodik (флаг `has_kodik`)
- Сортировка по новизне / рейтингу / дате добавления, три режима отображения
- Страница тайтла: описание, жанры, студия, кадры, связанные тайтлы, график серий
- Плеер Kodik: переключение серий и озвучек из нашего UI, названия эпизодов
- Страницы студий и команд озвучки, мгновенный поиск (по локальному кэшу + бэкенд)
- SEO: `sitemap.xml`, `robots.txt`, canonical-URL тайтлов, Open Graph
- Аккаунты: регистрация/логин, аватар, список просмотра (watchlist) с прогрессом
- Комментарии и отзывы с лайками и ответами
- Админ-панель: пользователи (роль/бан/сброс пароля), CMS статических страниц,
  журнал действий
- Статические страницы (пользовательское соглашение, приватность, копирайт)
- Тёмная тема (единственная)

## Стек

| Слой     | Технологии                                                 |
| -------- | ---------------------------------------------------------- |
| Backend  | Python 3.12+, FastAPI (async), httpx, MongoDB (Motor)      |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7 |

## Быстрый старт

Нужен запущенный MongoDB (локально `mongo:7` через Docker или MongoDB Atlas);
строка подключения задаётся в `.env` (`MONGODB_URI`, `MONGODB_DB`).

```bash
# 0. MongoDB (локально через Docker)
docker run -d -p 27017:27017 --name animewatch-mongo mongo:7

# 1. Backend (порт 3001)
cd app/backend
cp .env.example .env        # заполни KODIK_API_KEY + MONGODB_URI
npm run dev

# 2. Первичная загрузка каталога (один раз, ~1–3 часа, можно прервать)
python -m src.scripts.sync_shikimori full

# 3. Frontend (порт 5173)
cd app/frontend
npm run dev
```

Перенос данных со старой SQLite-базы (если была):
`python -m src.scripts.migrate_sqlite_to_mongo` (юзеры/комментарии/watchlist/
страницы/аудит; каталог не переносится — его наполняет ресинк выше).

Каталог наполняется по мере синхронизации; прогресс:
`python -m src.scripts.sync_shikimori status`. Свежие сезоны и онгоинги
обновляются автоматически раз в 24 часа при старте бекенда.

Флаг наличия озвучки Kodik (`has_kodik`) обновляется автоматически в конце
каждой синхронизации; вручную — `python -m src.scripts.sync_shikimori kodik`
(нужен `KODIK_API_KEY`). Пока проход не выполнен, скрытых тайтлов нет.

## Документация

- [Documentations.md](Documentations.md) — архитектура, поток данных, структура
- [app/backend/BACKEND_STRUCTURE.md](app/backend/BACKEND_STRUCTURE.md) — устройство бэкенда
- [app/frontend/FRONTEND_STRUCTURE.md](app/frontend/FRONTEND_STRUCTURE.md) — устройство фронтенда

## Проверки

```bash
cd app/backend  && python -m compileall src -q
cd app/frontend && npx tsc --noEmit && npx vite build
```
