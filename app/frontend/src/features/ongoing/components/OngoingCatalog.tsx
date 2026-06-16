import { CatalogBody } from '@/features/catalog/components/grid/CatalogBody'
import { SortDropdown } from '@/features/catalog/components/controls/SortDropdown'
import { ViewModeButtons } from '@/features/catalog/components/controls/ViewModeButtons'
import { useAnimeCatalog } from '@/features/catalog/hooks/useAnimeCatalog'
import { LoadMore } from '@/features/components/LoadMore'
import { OngoingCatalogInfo } from '@/features/ongoing/components/OngoingCatalogInfo'
import type {
	CatalogViewMode,
	ClientFilters,
	SortDirection,
	SortOption,
} from '@/types/catalog'
import { parseClientFilters } from '@/utils/catalog/catalogFilters'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export function OngoingCatalog() {
	const [searchParams] = useSearchParams()
	const [viewMode, setViewMode] = useState<CatalogViewMode>('poster')
	const [sortOption, setSortOption] = useState<SortOption>('новизне')
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
	const [isAutoLoadEnabled, setIsAutoLoadEnabled] = useState(false)
	const loadMoreRef = useRef<HTMLDivElement>(null)

	// Merge sidebar filters but always force status=ongoing
	const filters = useMemo<ClientFilters>(() => {
		const base = parseClientFilters(searchParams)
		return {
			...base,
			statuses: new Set(['ongoing']),
		}
	}, [searchParams])

	const catalog = useAnimeCatalog(
		viewMode,
		sortOption,
		sortDirection,
		filters,
	)

	function toggleSortOption(option: SortOption) {
		setIsAutoLoadEnabled(false)
		if (option === sortOption) {
			setSortDirection(d => (d === 'desc' ? 'asc' : 'desc'))
			return
		}
		setSortOption(option)
		setSortDirection('desc')
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
			<OngoingCatalogInfo />
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
			<CatalogBody
				viewMode={viewMode}
				catalog={catalog}
				emptyText='Онгоинги не найдены.'
			/>
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
