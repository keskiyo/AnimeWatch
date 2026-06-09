import { CatalogBody } from '@/features/catalog/components/CatalogBody'
import { CatalogIntro } from '@/features/catalog/components/CatalogIntro'
import { ViewModeButtons } from '@/features/catalog/components/ViewModeButtons'
import { useAnimeCatalog } from '@/features/catalog/hooks/useAnimeCatalog'
import { useCatalogFilters } from '@/features/catalog/hooks/useCatalogFilters'
import { LoadMore } from '@/features/components/LoadMore'
import type { CatalogViewMode } from '@/types/catalog'
import {
	CATALOG_INTRO_COLLAPSED,
	CATALOG_INTRO_EXPANDED,
} from '@/utils/catalogData'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SortDropdown } from './SortDropdown'

export function AnimeCatalog() {
	const [viewMode, setViewMode] = useState<CatalogViewMode>('poster')
	const [isIntroExpanded, setIsIntroExpanded] = useState(false)
	const [isAutoLoadEnabled, setIsAutoLoadEnabled] = useState(false)
	const loadMoreRef = useRef<HTMLDivElement>(null)

	const { params, sortOption, sortDirection, filterKey, setSort } =
		useCatalogFilters()

	const catalog = useAnimeCatalog(viewMode, params, filterKey)

	const introParagraphs = isIntroExpanded
		? CATALOG_INTRO_EXPANDED
		: CATALOG_INTRO_COLLAPSED

	function toggleSortOption(option: typeof sortOption) {
		setIsAutoLoadEnabled(false)
		if (option === sortOption) {
			setSort(option, sortDirection === 'desc' ? 'asc' : 'desc')
			return
		}
		setSort(option, 'desc')
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
	}, [filterKey])

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
