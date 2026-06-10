export type StudioSortKey = 'year' | 'rating' | 'title'
export type StudioSortDirection = 'asc' | 'desc'

export type StudioSortBarProps = {
	sort: StudioSortKey
	direction: StudioSortDirection
	onChange: (key: StudioSortKey) => void
}
