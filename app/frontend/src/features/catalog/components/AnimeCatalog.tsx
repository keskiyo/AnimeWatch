import { CatalogBody } from '@/features/catalog/components/grid/CatalogBody'
import { CatalogIntro } from '@/features/catalog/components/CatalogIntro'
import { ViewModeButtons } from '@/features/catalog/components/controls/ViewModeButtons'
import { useAnimeCatalog } from '@/features/catalog/hooks/useAnimeCatalog'
import { LoadMore } from '@/features/components/LoadMore'
import type {
	CatalogViewMode,
	SortDirection,
	SortOption,
} from '@/types/catalog'
import { parseClientFilters } from '@/utils/catalog/catalogFilters'
import {
	CATALOG_INTRO_COLLAPSED,
	CATALOG_INTRO_EXPANDED,
} from '@/utils/catalog/catalogTexts'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SortDropdown } from '@/features/catalog/components/controls/SortDropdown'
import { sortOptions } from '@/utils/catalog/catalogData'

export function AnimeCatalog() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [viewMode, setViewMode] = useState<CatalogViewMode>('poster')
	const [isIntroExpanded, setIsIntroExpanded] = useState(false)
	const [isAutoLoadEnabled, setIsAutoLoadEnabled] = useState(false)
	const loadMoreRef = useRef<HTMLDivElement>(null)
	const sortOption = normalizeSortOption(searchParams.get('sort'))
	const sortDirection =
		(searchParams.get('direction') as SortDirection) ?? 'desc'
	const filters = useMemo(
		() => parseClientFilters(searchParams),
		[searchParams],
	)

	const catalog = useAnimeCatalog(
		viewMode,
		sortOption,
		sortDirection,
		filters,
	)
	const introParagraphs = isIntroExpanded
		? CATALOG_INTRO_EXPANDED
		: CATALOG_INTRO_COLLAPSED

	function toggleSortOption(option: typeof sortOption) {
		setIsAutoLoadEnabled(false)
		setSearchParams(
			prev => {
				const next = new URLSearchParams(prev)
				if (option === sortOption) {
					next.set(
						'direction',
						sortDirection === 'desc' ? 'asc' : 'desc',
					)
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

	useEffect(() => {
		setIsAutoLoadEnabled(false)
	}, [filters])

	return (
		<section className='min-w-0 rounded-lg bg-aw-surface px-3.75 pb-7 pt-4'>
			<CatalogIntro
				isIntroExpanded={isIntroExpanded}
				onToggleIntro={() => setIsIntroExpanded(value => !value)}
				paragraphs={introParagraphs}
			/>
			<hr className='mt-4 border-0 border-t border-aw-border' />
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

function normalizeSortOption(value: string | null): SortOption {
	if (value === 'рейтинг (в работе)') return 'рейтингу'
	return sortOptions.includes(value as SortOption)
		? (value as SortOption)
		: 'новизне'
}
