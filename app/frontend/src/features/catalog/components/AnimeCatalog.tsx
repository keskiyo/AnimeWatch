import { LoadMore } from '@/features/components/LoadMore'
import { CatalogIntro } from '@/features/catalog/components/CatalogIntro'
import { ViewModeButtons } from '@/features/catalog/components/ViewModeButtons'
import { useAnimeCatalog } from '@/features/catalog/hooks/useAnimeCatalog'
import type { CatalogViewMode, SortDirection, SortOption } from '@/types/catalog'
import {
	CATALOG_INTRO_COLLAPSED,
	CATALOG_INTRO_EXPANDED,
	parseClientFilters,
} from '@/utils/catalogData'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimeCard } from './AnimeCard'
import { SortDropdown } from './SortDropdown'

const GRID_CLASSES: Record<CatalogViewMode, string> = {
	poster: 'grid grid-cols-4 gap-x-5 gap-y-7 max-[900px]:grid-cols-3 max-[640px]:grid-cols-2 max-[420px]:grid-cols-1',
	compact: 'grid grid-cols-2 gap-x-5 gap-y-7 max-[900px]:grid-cols-1',
	list: 'grid grid-cols-1 gap-x-5 gap-y-7',
}

export function AnimeCatalog() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [viewMode, setViewMode] = useState<CatalogViewMode>('poster')
	const [isIntroExpanded, setIsIntroExpanded] = useState(false)
	const [isAutoLoadEnabled, setIsAutoLoadEnabled] = useState(false)
	const loadMoreRef = useRef<HTMLDivElement>(null)

	const sortOption = (searchParams.get('sort') as SortOption) ?? 'новизне'
	const sortDirection =
		(searchParams.get('direction') as SortDirection) ?? 'desc'
	const filters = useMemo(() => parseClientFilters(searchParams), [searchParams])

	const catalog = useAnimeCatalog(viewMode, sortOption, sortDirection, filters)
	const introParagraphs = isIntroExpanded
		? CATALOG_INTRO_EXPANDED
		: CATALOG_INTRO_COLLAPSED

	function toggleSortOption(option: SortOption) {
		setIsAutoLoadEnabled(false)
		setSearchParams(
			prev => {
				const next = new URLSearchParams(prev)
				if (option === sortOption) {
					next.set('direction', sortDirection === 'desc' ? 'asc' : 'desc')
				} else {
					next.set('sort', option)
					next.set('direction', 'desc')
				}
				return next
			},
			{ replace: true },
		)
	}

	const onClickLoadMore = useCallback(() => {
		setIsAutoLoadEnabled(true)
		void catalog.loadMore()
	}, [catalog.loadMore])

	useEffect(() => {
		if (
			!isAutoLoadEnabled ||
			catalog.isInitialLoading ||
			catalog.isLoadingMore ||
			catalog.error ||
			!catalog.hasMore ||
			typeof IntersectionObserver === 'undefined'
		) {
			return
		}

		const target = loadMoreRef.current
		if (!target) return

		const observer = new IntersectionObserver(
			entries => {
				if (entries.some(entry => entry.isIntersecting)) {
					void catalog.loadMore()
				}
			},
			{ rootMargin: '260px 0px' },
		)

		observer.observe(target)

		return () => observer.disconnect()
	}, [
		catalog.error,
		catalog.hasMore,
		catalog.isInitialLoading,
		catalog.isLoadingMore,
		catalog.loadMore,
		isAutoLoadEnabled,
	])

	return (
		<section className='min-w-0 rounded-lg bg-aw-surface px-3.75 pb-7 pt-4'>
			<CatalogIntro
				isIntroExpanded={isIntroExpanded}
				onToggleIntro={() => setIsIntroExpanded(value => !value)}
				paragraphs={introParagraphs}
			/>
			<hr className='mt-4 border-0 border-t border-aw-border' />
			{!catalog.cacheComplete && catalog.cacheLoaded > 0 && (
				<div className='py-1.5 text-xs text-aw-subtle'>
					Загружено {catalog.cacheLoaded}
					{catalog.cacheTotal > 0 ? ` / ${catalog.cacheTotal}` : ''} аниме...
				</div>
			)}
			<div className='relative flex min-h-14.25 items-center justify-between'>
				<SortDropdown
					selected={sortOption}
					sortDirection={sortDirection}
					onChange={toggleSortOption}
				/>
				<ViewModeButtons viewMode={viewMode} onChange={setViewMode} />
			</div>
			<hr className='mb-7.75 border-0 border-t border-aw-border' />
			<CatalogBody viewMode={viewMode} catalog={catalog} />
			<div ref={loadMoreRef}>
				<LoadMore
					onClick={onClickLoadMore}
					isLoading={catalog.isLoadingMore}
					hasMore={
						!catalog.isInitialLoading &&
						!catalog.error &&
						catalog.hasMore
					}
					isAutoLoadEnabled={isAutoLoadEnabled}
				/>
			</div>
		</section>
	)
}

function CatalogBody({
	viewMode,
	catalog,
}: {
	viewMode: CatalogViewMode
	catalog: ReturnType<typeof useAnimeCatalog>
}) {
	if (catalog.isInitialLoading) {
		return (
			<div className='py-10 text-center text-aw-subtle'>
				Загрузка каталога...
			</div>
		)
	}

	if (catalog.error) {
		return (
			<div className='py-10 text-center text-aw-subtle'>{catalog.error}</div>
		)
	}

	if (catalog.anime.length === 0) {
		return (
			<div className='py-10 text-center text-aw-subtle'>
				Ничего не найдено по заданным фильтрам.
			</div>
		)
	}

	return (
		<div className={GRID_CLASSES[viewMode]}>
			{catalog.anime.map(anime => (
				<AnimeCard key={anime.id} anime={anime} variant={viewMode} />
			))}
		</div>
	)
}
