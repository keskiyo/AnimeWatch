import type { Anime } from '@/types/anime'
import type {
	CatalogViewMode,
	ClientFilters,
	SortDirection,
	SortOption,
} from '@/types/catalog'
import { applyFilters, applySort } from '@/utils/catalog/catalogClientFilter'
import { CATALOG_VIEW_MODES } from '@/utils/catalog/catalogData'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAnimeCache } from './useAnimeCache'

export type AnimeCatalogState = {
	anime: Anime[]
	error?: string
	isInitialLoading: boolean
	isLoadingMore: boolean
	hasMore: boolean
	cacheLoaded: number
	cacheTotal: number
	cacheComplete: boolean
	loadMore: () => Promise<void>
}

export function useAnimeCatalog(
	viewMode: CatalogViewMode,
	sortOption: SortOption,
	sortDirection: SortDirection,
	filters?: ClientFilters,
): AnimeCatalogState {
	const {
		anime: allAnime,
		total: cacheTotal,
		isComplete,
		isLoading,
		error,
	} = useAnimeCache()

	const pageSize = useMemo(
		() => CATALOG_VIEW_MODES.find(m => m.id === viewMode)?.limit ?? 12,
		[viewMode],
	)

	const [displayCount, setDisplayCount] = useState(pageSize)

	// Build a stable key from filters + sort so we can reset display count
	const resetKey = useMemo(() => {
		const f = filters
		return [
			sortOption,
			sortDirection,
			...(f ? [...f.types].sort() : []),
			'|',
			...(f ? [...f.statuses].sort() : []),
			'|',
			...(f ? [...f.ageRatings].sort() : []),
			'|',
			...(f ? [...f.episodeCounts].sort() : []),
			'|',
			...(f ? [...f.genres].sort() : []),
			f?.isStrictMatch ?? false,
			f?.fromYear ?? 1980,
			f?.toYear ?? new Date().getFullYear(),
		].join(',')
	}, [filters, sortOption, sortDirection])

	// Reset display count when filters or sort change
	useEffect(() => {
		setDisplayCount(pageSize)
	}, [resetKey, pageSize])

	const processed = useMemo(() => {
		const filtered = filters ? applyFilters(allAnime, filters) : allAnime
		const excludeAnnounced =
			sortOption === 'новизне' && !filters?.statuses.has('announced')
		return applySort(filtered, sortOption, sortDirection, excludeAnnounced)
	}, [allAnime, filters, sortOption, sortDirection])
	const displayed = processed.slice(0, displayCount)
	const hasMore = displayCount < processed.length

	const loadMore = useCallback(async () => {
		setDisplayCount(prev => prev + pageSize)
	}, [pageSize])

	return {
		anime: displayed,
		error,
		isInitialLoading: allAnime.length === 0 && isLoading,
		isLoadingMore: false,
		hasMore,
		cacheLoaded: allAnime.length,
		cacheTotal,
		cacheComplete: isComplete,
		loadMore,
	}
}
