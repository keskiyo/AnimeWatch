# Frontend Structure

Документ описывает, как устроена папка `app/frontend` и куда добавлять новые
страницы, компоненты, типы и API helpers.

## Корень `app/frontend`

- `src/` — весь исходный код React/Vite.
- `dist/` — результат сборки, не редактировать вручную.
- `node_modules/` — зависимости.
- `package.json`, `vite.config.*`, `tsconfig.*` — настройки проекта.


## `src/main.tsx` и `src/app/`

- `main.tsx` монтирует React-приложение.
- `app/App.tsx` описывает routes, общий layout, `Header`, `Footer` и
  `ToastContainer`.


## `src/api/`

Один файл на домен API. Компоненты не должны напрямую использовать `axios`.

- `client.ts` — общий Axios client и base URL.
- `fallback.ts` — безопасный wrapper для fallback response.
- `catalogApi.ts` — `/anime`, `/anime/bulk`, studio/dubbing catalog.
- `animeApi.ts` — detail, related, episodes.
- `playerApi.ts` — Kodik player.
- `scheduleApi.ts` — расписание и home rail helpers.
- `authApi.ts` — login/register/me/logout/avatar/password/name.
- `watchlistApi.ts` — watchlist mutations/reads.
- `commentsApi.ts` — comments, votes, edit/delete.
- `usersApi.ts` — public profiles.
- `adminApi.ts` — admin: users, audit, user actions.
- `pagesApi.ts` — статические страницы (публичные + admin CRUD).


## `src/pages/`


- `home/HomePage.tsx` — главная: rail новых аниме и SEO-текст.
- `anime/CatalogPage.tsx` — общий каталог.
- `anime/CatalogOngoing.tsx` — страница ongoing.
- `anime/AnimePage.tsx` — detail page; сначала показывает detail из Mongo, затем
  догружает player/related.
- `studio/StudioPage.tsx` — список аниме студии.
- `dubbing/DubbingPage.tsx` — список по озвучке.
- `profile/ProfilePage.tsx`, `profile/UserProfilePage.tsx` — свой и публичный
  профиль.
- `admin/AdminPage.tsx` — админ-панель (вкладки: пользователи, страницы,
  журнал; доступ только админу).
- `footer/*` — статические страницы agreement/privacy/copyright (контент из
  Mongo через `pagesApi`).
- `not-found/NotFoundPage.tsx` — 404.

## `src/components/`

Общие reusable-компоненты, не привязанные к конкретной feature.

- `anime/PosterImage.tsx` — единый компонент постеров. Всегда используй его для
  anime poster images, потому что он применяет proxy/fallback логику.
- `anime/AnimeGridSection.tsx` — общий grid/section для списков.
- `layout/Header.tsx`, `layout/Footer.tsx` — shell layout.
- `ui/NumberInput.tsx` — кастомный number input со стрелками.


## `src/features/`


### `features/catalog/`

- `hooks/useAnimeCache.ts` — session-level cache для `/anime/bulk` (zustand store).
- `hooks/useAnimeCatalog.ts` — применяет client-side filters/sort/pagination.
- `hooks/useCatalogFilterParams.ts` — состояние фильтров каталога.
- `components/CatalogPageLayout.tsx`, `CatalogIntro.tsx`, `AnimeCatalog.tsx`.
- `components/filters/*` — sidebar filters, genres, year range, checkbox groups.
- `components/controls/*` — sort dropdown и view mode buttons.
- `components/grid/*` — `AnimeCard`, `CatalogBody`.


### `features/animepage/`

- `components/AnimePageContent.tsx` — собирает detail page.
- `components/hero/*` — poster/actions/info panel/hero.
- `components/player/*` — Kodik iframe frame, episodes, sidebar, placeholder.
- `components/frames/*` — screenshots и lightbox.
- `components/comments/*` — reviews/comments UI; `CommentThread.tsx`
  рекурсивно рендерит дерево ответов (сворачивание, «Ещё N ответов»).
- `components/AnimeRelated.tsx` — related block.
- `hooks/useAnimePlayerState.ts`, `useEpisodePages.ts`, `useAnimeComments.ts`.


### `features/header/`

- `components/HeaderMobileMenu.tsx`, `HeaderUserChip.tsx`.
- `components/search/*` — search modal and result item.
- `components/auth/*` — auth modal, login/signup forms.
- `hooks/useAnimeSearch.ts` — поиск по cache + API helper.

### `features/profile/`

- `AvatarUpload.tsx`, `ProfileSettings.tsx`, `ChangeNameForm.tsx`,
  `ChangePasswordForm.tsx`.
- `components/watchlist/*` — tabs, filters, dropdowns, cards, profile watchlist.


### `features/admin/`

Компоненты сгруппированы по доменам (блок-подпапки):
- `components/users/` — AdminUsersPanel/Table/UserActions/PasswordResetModal.
- `components/pages/` — AdminPagesPanel (CMS).
- `components/audit/` — AdminAuditPanel (журнал).
- `components/comments/` — AdminCommentsPanel/Table (модерация).
- `components/` (общие, cross-block): AdminTabs, AdminPagination,
  AdminConfirmDialog, AdminPageParts.
- `hooks/` (плоско): useAdminUsers, useAdminAudit, useAdminStaticPages,
  useAdminComments.

### `features/static-pages/`

- `StaticPageView.tsx` — рендер статической страницы из `pagesApi`.

### Other Features

- `features/home/HomeSeasonRail.tsx` — горизонтальный rail на главной.
- `features/ongoing/*` — ongoing catalog blocks.
- `features/studio/StudioSortBar.tsx` — сортировка studio page.
- `features/auth/useAuthUser.ts` — shared session store (zustand).
- `features/auth/authModalBus.ts` — открытие auth modal из любого места.
- `features/components/*` — небольшие shared feature helpers.

## `src/types/`

- `anime.ts` — Anime, RelatedAnime, KodikPlayer, WatchlistEntry, schedule.
- `animePage.ts` — view models для detail/player.
- `catalog.ts`, `studio.ts`, `search.ts`, `auth.ts`, `reviews.ts`,
  `watchlist.ts`, `admin.ts`, `staticPage.ts`.


## `src/utils/`

Сгруппированы по доменам:
- `catalog/` — catalogClientFilter, catalogFilters, catalogData,
  catalogFormatters, catalogTexts.
- `animepage/` — animePageData, animePagePlayerData, animeInfoRows,
  animePageFormatters, animePageLabels, structuredData (JSON-LD), player.
- `anime/` — animeSlug, animeRating, animeYear, imageProxy, kodikLink.
- `watchlist/` — watchlist, watchlistData.
- `comments/` — commentTree. `staticPage/` — staticPageMarkup.
- корень (cross-cutting): `notify.ts`, `authValidation.ts`,
  `pageMeta.ts` (title/canonical/OG/robots/JSON-LD).


## `src/styles/index.css`


## Data Flow

1. `useAnimeCache` грузит `/anime/bulk` один раз за JS-сессию.
2. Каталог, ongoing, поиск и карточки фильтруются на клиенте из cache.
3. Detail page получает `/animes/:id` из Mongo-backed backend.
4. Плеер Kodik догружается отдельно и не должен блокировать hero/detail.
5. Toast показывается через `utils/notify.ts`; позиция задаётся в `App.tsx`.

## Verification

- `bun run build`
- при точечных тестах: `bun test <file>`

