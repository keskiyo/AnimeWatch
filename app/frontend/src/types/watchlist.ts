import type { FilterGroup } from '@/types/catalog'
import type { ReactNode } from 'react'

export type WatchlistSort = 'date-desc' | 'date-asc'

export type WatchlistFilterState = {
	query: string
	genres: Set<string>
	isStrictMatch: boolean
	groups: Set<string>
	fromYear: number
	toYear: number
	sort: WatchlistSort
}

export type WatchlistSortOption = {
	value: WatchlistSort
	label: string
}

export type WatchlistFiltersProps = {
	filters: WatchlistFilterState
	onChange: (filters: WatchlistFilterState) => void
}

export type WatchlistFilterDropdownProps = {
	label: string
	value?: string
	children: ReactNode
	onClear: () => void
}

export type WatchlistGenreFilterProps = {
	genres: Set<string>
	isStrictMatch: boolean
	onToggleGenre: (genre: string) => void
	onStrictChange: () => void
	onClear: () => void
}

export type WatchlistTypeFilterProps = {
	group: FilterGroup
	selected: Set<string>
	onToggle: (value: string) => void
	onClear: () => void
}

export type WatchlistSortFilterProps = {
	value: WatchlistSort
	onChange: (value: WatchlistSort) => void
}
