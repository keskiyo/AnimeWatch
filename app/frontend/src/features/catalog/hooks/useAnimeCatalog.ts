import type { Anime } from '@/types/anime'
import type {
	CatalogViewMode,
	ClientFilters,
	SortDirection,
	SortOption,
} from '@/types/catalog'
import { CATALOG_VIEW_MODES } from '@/utils/catalogData'
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
	const { anime: allAnime, total: cacheTotal, isComplete, isLoading } =
		useAnimeCache()

	const pageSize = useMemo(
		() =>
			CATALOG_VIEW_MODES.find(m => m.id === viewMode)?.limit ?? 12,
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

	useEffect(() => {
		setDisplayCount(pageSize)
	}, [resetKey, pageSize])

	const processed = useMemo(() => {
		const filtered = filters ? applyFilters(allAnime, filters) : allAnime
		return applySort(filtered, sortOption, sortDirection)
	}, [allAnime, filters, sortOption, sortDirection])

	const displayed = processed.slice(0, displayCount)
	const hasMore = displayCount < processed.length

	const loadMore = useCallback(async () => {
		setDisplayCount(prev => prev + pageSize)
	}, [pageSize])

	return {
		anime: displayed,
		isInitialLoading: allAnime.length === 0 && isLoading,
		isLoadingMore: false,
		hasMore,
		cacheLoaded: allAnime.length,
		cacheTotal,
		cacheComplete: isComplete,
		loadMore,
	}
}

// ─── Client-side filtering ──────────────────────────────────────────────────

function applyFilters(anime: Anime[], f: ClientFilters): Anime[] {
	const { types, statuses, ageRatings, episodeCounts, genres, isStrictMatch, fromYear, toYear } = f

	return anime.filter(item => {
		// Type
		if (types.size > 0 && !types.has(item.type)) return false

		// Status (special-case "recent" = released in last 6 months)
		if (statuses.size > 0) {
			const includeRecent = statuses.has('recent')
			const directStatuses = new Set([...statuses].filter(s => s !== 'recent'))

			let ok = directStatuses.size > 0 && directStatuses.has(item.status)
			if (!ok && includeRecent) {
				const cutoff = new Date()
				cutoff.setMonth(cutoff.getMonth() - 6)
				ok = new Date(item.updated_at) >= cutoff
			}
			if (!ok) return false
		}

		// Year range
		if (item.year < fromYear || item.year > toYear) return false

		// Genres
		if (genres.size > 0) {
			const itemGenres = item.genres
			if (isStrictMatch) {
				if (![...genres].every(g => itemGenres.includes(g))) return false
			} else {
				if (!itemGenres.some(g => genres.has(g))) return false
			}
		}

		// Episode count
		if (episodeCounts.size > 0) {
			const ep = item.episodes_total > 0 ? item.episodes_total : item.episodes_aired
			let ok = false
			if (episodeCounts.has('Короткие') && ep > 0 && ep <= 4) ok = true
			if (episodeCounts.has('Средние') && ep >= 5 && ep <= 16) ok = true
			if (episodeCounts.has('Длинные') && ep >= 17 && ep <= 100) ok = true
			if (episodeCounts.has('Очень длинные') && ep > 100) ok = true
			if (!ok) return false
		}

		// Age rating — only if the backend sends this field
		if (ageRatings.size > 0) {
			const mpaa = (item as Anime & { rating_mpaa?: string }).rating_mpaa
			if (mpaa && !ageRatings.has(mpaa)) return false
		}

		return true
	})
}

// ─── Client-side sorting ────────────────────────────────────────────────────

function applySort(anime: Anime[], option: SortOption, direction: SortDirection): Anime[] {
	return [...anime].sort((a, b) => {
		let cmp = 0

		if (option === 'рейтингу') {
			cmp = b.rating - a.rating
		} else if (option === 'новизне') {
			cmp = b.year - a.year
			if (cmp === 0) {
				cmp =
					new Date(b.updated_at).getTime() -
					new Date(a.updated_at).getTime()
			}
		} else {
			// дате добавления — use id as proxy (higher id = added later)
			cmp = b.id - a.id
		}

		return direction === 'asc' ? -cmp : cmp
	})
}
