import type { SortDirection, SortOption } from '@/types/catalog'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

// ─── Sort mapping (from SortDropdown comments) ────────────────────────────────

export const SORT_TO_PARAM: Record<SortOption, string> = {
	новизне: 'startDate',
	'дате добавления': 'createdAt',
	рейтингу: 'rating',
}

const SORT_FROM_PARAM: Record<string, SortOption> = {
	startDate: 'новизне',
	createdAt: 'дате добавления',
	rating: 'рейтингу',
}

// ─── Filter group → API param name ────────────────────────────────────────────
// Keys must match group.title values from filterGroups in catalogData.ts

const GROUP_TO_PARAM: Record<string, string> = {
	Тип: 'type',
	Статус: 'status',
	Сезон: 'season',
}

// ─── UI label ↔ API value ─────────────────────────────────────────────────────

const LABEL_TO_API: Record<string, string> = {
	'ТВ-сериал': 'tv',
	Фильм: 'movie',
	OVA: 'ova',
	ONA: 'ona',
	Спешл: 'special',
	Онгоинг: 'ongoing',
	Вышло: 'released',
	Анонс: 'anons',
	Зима: 'winter',
	Весна: 'spring',
	Лето: 'summer',
	Осень: 'fall',
}

const API_TO_LABEL = Object.fromEntries(
	Object.entries(LABEL_TO_API).map(([label, api]) => [api, label]),
) as Record<string, string>

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

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
					const current = next.getAll(paramName)
					next.delete(paramName)
					if (current.includes(apiValue)) {
						current
							.filter(v => v !== apiValue)
							.forEach(v => next.append(paramName, v))
					} else {
						;[...current, apiValue].forEach(v =>
							next.append(paramName, v),
						)
					}
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
					const current = next.getAll('genre')
					next.delete('genre')
					if (current.includes(genre)) {
						current
							.filter(v => v !== genre)
							.forEach(v => next.append('genre', v))
					} else {
						;[...current, genre].forEach(v =>
							next.append('genre', v),
						)
					}
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

	const setYearFrom = useCallback(
		(year: number) => {
			setSearchParams(
				prev => {
					const next = new URLSearchParams(prev)
					if (year !== DEFAULT_YEAR_FROM)
						next.set('yearFrom', String(year))
					else next.delete('yearFrom')
					next.delete('page')
					return next
				},
				{ replace: true },
			)
		},
		[setSearchParams],
	)

	const setYearTo = useCallback(
		(year: number) => {
			setSearchParams(
				prev => {
					const next = new URLSearchParams(prev)
					if (year !== DEFAULT_YEAR_TO)
						next.set('yearTo', String(year))
					else next.delete('yearTo')
					next.delete('page')
					return next
				},
				{ replace: true },
			)
		},
		[setSearchParams],
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
