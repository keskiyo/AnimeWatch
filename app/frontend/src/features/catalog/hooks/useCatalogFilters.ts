import type { SortDirection, SortOption } from '@/types/catalog'
import {
	API_TO_LABEL,
	GROUP_TO_PARAM,
	LABEL_TO_API,
	SORT_FROM_PARAM,
	SORT_TO_PARAM,
	toggleParamValue,
} from '@/utils/catalogFilterMaps'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export type CatalogFilterParams = {
	sort: string
	order: SortDirection
	genres: string[]
	strictMatch: boolean
	yearFrom: number
	yearTo: number
	type: string[]
	status: string[]
	season: string[]
}

const DEFAULT_YEAR_FROM = 1959
const DEFAULT_YEAR_TO = new Date().getFullYear()

export function useCatalogFilters() {
	const [searchParams, setSearchParams] = useSearchParams()

	const params: CatalogFilterParams = {
		sort: searchParams.get('sort') ?? 'startDate',
		order: (searchParams.get('order') as SortDirection) ?? 'desc',
		genres: searchParams.getAll('genre'),
		strictMatch: searchParams.get('strict') === '1',
		yearFrom: Number(searchParams.get('yearFrom') ?? DEFAULT_YEAR_FROM),
		yearTo: Number(searchParams.get('yearTo') ?? DEFAULT_YEAR_TO),
		type: searchParams.getAll('type'),
		status: searchParams.getAll('status'),
		season: searchParams.getAll('season'),
	}

	const sortOption: SortOption = SORT_FROM_PARAM[params.sort] ?? 'новизне'

	// Checked set for CheckboxGroup — expects "GroupTitle:Label" keys
	const checkedSet = useMemo(() => {
		const set = new Set<string>()
		for (const [groupTitle, paramName] of Object.entries(GROUP_TO_PARAM)) {
			for (const apiVal of searchParams.getAll(paramName)) {
				const label = API_TO_LABEL[apiVal] ?? apiVal
				set.add(`${groupTitle}:${label}`)
			}
		}
		return set
	}, [searchParams])

	const checkedGenres = useMemo(() => new Set(params.genres), [params.genres])

	// Stable string key — used as useEffect dep in useAnimeCatalog
	const filterKey = [
		params.sort,
		params.order,
		params.genres.join(','),
		params.strictMatch ? '1' : '0',
		params.yearFrom,
		params.yearTo,
		params.type.join(','),
		params.status.join(','),
		params.season.join(','),
	].join('|')

	// ── Setters ──────────────────────────────────────────────────────────────

	const setSort = useCallback(
		(option: SortOption, direction: SortDirection) => {
			setSearchParams(
				prev => {
					const next = new URLSearchParams(prev)
					next.set('sort', SORT_TO_PARAM[option])
					next.set('order', direction)
					next.delete('page')
					return next
				},
				{ replace: true },
			)
		},
		[setSearchParams],
	)

	const toggleCheckbox = useCallback(
		(key: string) => {
			const sep = key.indexOf(':')
			if (sep === -1) return
			const groupTitle = key.slice(0, sep)
			const label = key.slice(sep + 1)
			const paramName = GROUP_TO_PARAM[groupTitle]
			if (!paramName) return
			const apiValue = LABEL_TO_API[label] ?? label.toLowerCase()

			setSearchParams(
				prev => {
					const next = new URLSearchParams(prev)
					toggleParamValue(next, paramName, apiValue)
					next.delete('page')
					return next
				},
				{ replace: true },
			)
		},
		[setSearchParams],
	)

	const toggleGenre = useCallback(
		(genre: string) => {
			setSearchParams(
				prev => {
					const next = new URLSearchParams(prev)
					toggleParamValue(next, 'genre', genre)
					next.delete('page')
					return next
				},
				{ replace: true },
			)
		},
		[setSearchParams],
	)

	const toggleStrictMatch = useCallback(() => {
		setSearchParams(
			prev => {
				const next = new URLSearchParams(prev)
				if (prev.get('strict') === '1') next.delete('strict')
				else next.set('strict', '1')
				return next
			},
			{ replace: true },
		)
	}, [setSearchParams])

	const setYear = useCallback(
		(param: 'yearFrom' | 'yearTo', year: number, defaultYear: number) => {
			setSearchParams(
				prev => {
					const next = new URLSearchParams(prev)
					if (year !== defaultYear) next.set(param, String(year))
					else next.delete(param)
					next.delete('page')
					return next
				},
				{ replace: true },
			)
		},
		[setSearchParams],
	)

	const setYearFrom = useCallback(
		(year: number) => setYear('yearFrom', year, DEFAULT_YEAR_FROM),
		[setYear],
	)

	const setYearTo = useCallback(
		(year: number) => setYear('yearTo', year, DEFAULT_YEAR_TO),
		[setYear],
	)

	const resetFilters = useCallback(() => {
		setSearchParams(
			prev => {
				// Keep only sort — clear everything else
				const next = new URLSearchParams()
				const sort = prev.get('sort')
				const order = prev.get('order')
				if (sort) next.set('sort', sort)
				if (order) next.set('order', order)
				return next
			},
			{ replace: true },
		)
	}, [setSearchParams])

	return {
		params,
		sortOption,
		sortDirection: params.order,
		checkedSet,
		checkedGenres,
		filterKey,
		setSort,
		toggleCheckbox,
		toggleGenre,
		toggleStrictMatch,
		setYearFrom,
		setYearTo,
		resetFilters,
	}
}
