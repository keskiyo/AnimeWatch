import type { WatchlistStatus } from '@/types/anime'
import type { WatchlistSortOption } from '@/types/watchlist'

export const WATCHLIST_STATUSES: WatchlistStatus[] = [
	'watching',
	'plan_to_watch',
	'completed',
	'on_hold',
	'dropped',
]

export const WATCHLIST_LABELS: Record<WatchlistStatus, string> = {
	watching: 'Смотрю',
	plan_to_watch: 'В планах',
	completed: 'Просмотрено',
	on_hold: 'Отложено',
	dropped: 'Брошено',
}

export const WATCHLIST_TYPE_LABELS: Record<string, string> = {
	tv: 'TV',
	movie: 'Фильм',
	ova: 'OVA',
	ona: 'ONA',
	special: 'Спешл',
}

export const WATCHLIST_SORT_OPTIONS: WatchlistSortOption[] = [
	{ value: 'date-desc', label: 'Сначала новые' },
	{ value: 'date-asc', label: 'Сначала старые' },
]

export const TYPE_BY_LABEL: Record<string, string> = {
	Сериал: 'tv',
	Фильм: 'movie',
	OVA: 'ova',
	ONA: 'ona',
	Спешл: 'special',
}
