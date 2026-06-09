import { getCatalog } from '@/api/animeApi'
import type { Anime } from '@/types/anime'
import type { CatalogViewMode, SortDirection, SortOption } from '@/types/catalog'
import { CATALOG_VIEW_MODES } from '@/utils/catalogData'
import { useCallback, useEffect, useMemo, useState } from 'react'

export type CatalogFilters = {
	type?: string
	status?: string
	year_from?: string
	year_to?: string
	genres?: string
	age_rating?: string
}

export type AnimeCatalogState = {
	anime: Anime[]
	error?: string
	isInitialLoading: boolean
	isLoadingMore: boolean
	hasMore: boolean
	loadMore: () => Promise<void>
}

export function useAnimeCatalog(
	viewMode: CatalogViewMode,
	sortOption: SortOption,
	sortDirection: SortDirection,
	filters?: CatalogFilters,
): AnimeCatalogState {
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [isInitialLoading, setIsInitialLoading] = useState(true)
	const [anime, setAnime] = useState<Anime[]>([])
	const [page, setPage] = useState(1)
	const [total, setTotal] = useState(0)
	const [error, setError] = useState<string | undefined>()
	const viewLimit = useMemo(
		() =>
			CATALOG_VIEW_MODES.find(mode => mode.id === viewMode)?.limit ??
			CATALOG_VIEW_MODES[0]!.limit,
		[viewMode],
	)
	const hasMore = anime.length < total
	const filtersKey = JSON.stringify(filters ?? null)

	useEffect(() => {
		let isCancelled = false

		async function loadFirstPage() {
			setIsInitialLoading(true)
			setError(undefined)

			try {
				const result = await getCatalog({
					page: '1',
					limit: String(viewLimit),
					sort: getSortParam(sortOption),
					direction: sortDirection,
					...(filters ?? {}),
				})

				if (isCancelled) return

				setAnime(result.data)
				setPage(result.page)
				setTotal(result.total)
			} catch {
				if (!isCancelled) {
					setError('Не удалось загрузить каталог.')
				}
			} finally {
				if (!isCancelled) {
					setIsInitialLoading(false)
				}
			}
		}

		void loadFirstPage()

		return () => {
			isCancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sortDirection, sortOption, viewLimit, filtersKey])

	const loadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore) return

		setIsLoadingMore(true)

		try {
			const nextPage = page + 1
			const result = await getCatalog({
				page: String(nextPage),
				limit: String(viewLimit),
				sort: getSortParam(sortOption),
				direction: sortDirection,
				...(filters ?? {}),
			})

			setAnime(current => [...current, ...result.data])
			setPage(result.page)
			setTotal(result.total)
		} finally {
			setIsLoadingMore(false)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasMore, isLoadingMore, page, sortDirection, sortOption, viewLimit, filtersKey])

	return {
		anime,
		error,
		isInitialLoading,
		isLoadingMore,
		hasMore,
		loadMore,
	}
}

function getSortParam(option: SortOption): string {
	if (option === 'рейтингу') return 'rating'
	if (option === 'дате добавления') return 'createdAt'
	return 'startDate'
}
