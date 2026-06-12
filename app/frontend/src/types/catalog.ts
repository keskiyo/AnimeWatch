export type CatalogViewMode = 'poster' | 'compact' | 'list'

export type CatalogViewModeOption = {
	id: CatalogViewMode
	label: string
	limit: number
}

export type CheckboxGroupProps = {
	group: FilterGroup
	checked: Set<string>
	onToggle: (value: string) => void
}

export type GenreDropdownProps = {
	checked: Set<string>
	isStrictMatch: boolean
	resetKey: number
	onToggleGenre: (value: string) => void
	onToggleStrictMatch: () => void
}

export type SortOption = 'дате добавления' | 'новизне' | 'рейтингу'
export type SortDirection = 'asc' | 'desc'

export type ClientFilters = {
	types: Set<string>
	statuses: Set<string>
	ageRatings: Set<string>
	episodeCounts: Set<string>
	genres: Set<string>
	isStrictMatch: boolean
	fromYear: number
	toYear: number
}

export type SortDropdownProps = {
	selected: SortOption
	sortDirection: SortDirection
	onChange: (option: SortOption) => void
}

export type FilterText = 'Возрастное ограничение' | 'Количество серий'

export type FilterGroup = {
	title?: string
	hasInfo?: FilterText
	options: string[]
}
