import { getCatalog } from '@/api/animeApi'
import type { Anime } from '@/types/anime'
import type { CatalogViewMode } from '@/types/catalog'
import { CATALOG_VIEW_MODES } from '@/utils/catalogData'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogFilterParams } from './useCatalogFilters'

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
	params: CatalogFilterParams,
	filterKey: string,
): AnimeCatalogState {
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [isInitialLoading, setIsInitialLoading] = useState(true)
	const [anime, setAnime] = useState<Anime[]>([])
	const [page, setPage] = useState(1)
	const [total, setTotal] = useState(0)
	const [error, setError] = useState<string | undefined>()

	const viewLimit = useMemo(
		() =>
			CATALOG_VIEW_MODES.find(m => m.id === viewMode)?.limit ??
			CATALOG_VIEW_MODES[0]!.limit,
		[viewMode],
	)

	const hasMore = anime.length < total

	// Ref so loadMore always reads current params without being in its dep array
	const paramsRef = useRef(params)
	paramsRef.current = params

	// Reset and reload first page whenever filters or viewLimit change
	useEffect(() => {
		let isCancelled = false

		async function loadFirstPage() {
			setIsInitialLoading(true)
			setError(undefined)

			try {
				const result = await getCatalog(
					buildApiParams(params, '1', String(viewLimit)),
				)

				if (isCancelled) return

				setAnime(result.data)
				setPage(result.page)
				setTotal(result.total)
			} catch {
				if (!isCancelled) setError('Не удалось загрузить каталог.')
			} finally {
				if (!isCancelled) setIsInitialLoading(false)
			}
		}

		void loadFirstPage()

		return () => {
			isCancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterKey, viewLimit])

	const loadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore) return

		setIsLoadingMore(true)

		try {
			const nextPage = page + 1
			const result = await getCatalog(
				buildApiParams(
					paramsRef.current,
					String(nextPage),
					String(viewLimit),
				),
			)
			setAnime(current => [...current, ...result.data])
			setPage(result.page)
			setTotal(result.total)
		} finally {
			setIsLoadingMore(false)
		}
	}, [hasMore, isLoadingMore, page, viewLimit])

	return { anime, error, isInitialLoading, isLoadingMore, hasMore, loadMore }
}

function buildApiParams(
	params: CatalogFilterParams,
	page: string,
	limit: string,
) {
	return {
		page,
		limit,
		sort: params.sort,
		order: params.order as 'asc' | 'desc',
		...(params.genres.length && { genre: params.genres.join(',') }),
		...(params.type.length && { type: params.type.join(',') }),
		...(params.status.length && { status: params.status.join(',') }),
		...(params.season.length && { season: params.season.join(',') }),
		...(params.yearFrom !== 1959 && { yearFrom: String(params.yearFrom) }),
		...(params.yearTo !== new Date().getFullYear() && {
			yearTo: String(params.yearTo),
		}),
		...(params.strictMatch && params.genres.length && { strict: '1' }),
	}
}
