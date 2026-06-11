import type { Anime, WatchlistEntry, WatchlistStatus } from '@/types/anime'

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

export function getWatchlistTitle(anime: Anime): string {
	return anime.title_ru || anime.title_en || 'Неизвестно'
}

export function filterWatchlistEntries(
	entries: WatchlistEntry[],
	query: string,
	genre: string,
	type: string,
): WatchlistEntry[] {
	const q = query.trim().toLowerCase()
	return entries.filter(entry => {
		const anime = entry.anime
		const title = anime
			? `${anime.title_ru} ${anime.title_en}`.toLowerCase()
			: 'неизвестно'
		if (q && !title.includes(q)) return false
		if (genre && !anime?.genres.includes(genre)) return false
		if (type && anime?.type !== type) return false
		return true
	})
}

export function sortWatchlistEntries(
	entries: WatchlistEntry[],
	sort: string,
): WatchlistEntry[] {
	return [...entries].sort((a, b) => {
		if (sort === 'title-desc') return titleCompare(b, a)
		if (sort === 'rating-desc') return ratingCompare(b, a)
		if (sort === 'rating-asc') return ratingCompare(a, b)
		if (sort === 'date-asc') return dateCompare(a, b)
		return dateCompare(b, a)
	})
}

function titleCompare(a: WatchlistEntry, b: WatchlistEntry): number {
	const aTitle = a.anime ? getWatchlistTitle(a.anime) : 'Неизвестно'
	const bTitle = b.anime ? getWatchlistTitle(b.anime) : 'Неизвестно'
	return aTitle.localeCompare(bTitle, 'ru')
}

function ratingCompare(a: WatchlistEntry, b: WatchlistEntry): number {
	return (a.anime?.rating ?? 0) - (b.anime?.rating ?? 0)
}

function dateCompare(a: WatchlistEntry, b: WatchlistEntry): number {
	return new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
}
