import type { Anime, WatchlistEntry } from '@/types/anime'
import type { WatchlistFilterState, WatchlistSort } from '@/types/watchlist'
import { TYPE_BY_LABEL } from '@/utils/watchlist/watchlistData'

export function getWatchlistTitle(anime: Anime): string {
	return anime.title_ru || anime.title_en || 'Неизвестно'
}

export function filterWatchlistEntries(
	entries: WatchlistEntry[],
	filters: WatchlistFilterState,
): WatchlistEntry[] {
	const q = filters.query.trim().toLowerCase()
	return entries.filter(entry => {
		const anime = entry.anime
		const title = anime
			? `${anime.title_ru} ${anime.title_en}`.toLowerCase()
			: 'неизвестно'
		if (q && !title.includes(q)) return false
		if (!anime) return !hasStructuredFilters(filters)
		if (anime.year < filters.fromYear || anime.year > filters.toYear) return false
		if (!matchesGenres(anime, filters)) return false
		if (!matchesType(anime, filters)) return false
		return true
	})
}

export function sortWatchlistEntries(
	entries: WatchlistEntry[],
	sort: WatchlistSort,
): WatchlistEntry[] {
	return [...entries].sort((a, b) => {
		if (sort === 'date-asc') return dateCompare(a, b)
		return dateCompare(b, a)
	})
}

function matchesGenres(anime: Anime, filters: WatchlistFilterState): boolean {
	if (filters.genres.size === 0) return true
	if (filters.isStrictMatch) {
		return [...filters.genres].every(genre => anime.genres.includes(genre))
	}
	return anime.genres.some(genre => filters.genres.has(genre))
}

function matchesType(anime: Anime, filters: WatchlistFilterState): boolean {
	const selected = valuesForGroup(filters.groups, 'Тип')
	if (selected.length === 0) return true
	return selected.some(label => TYPE_BY_LABEL[label] === anime.type)
}

function valuesForGroup(groups: Set<string>, group: string): string[] {
	return [...groups]
		.filter(value => value.startsWith(`${group}:`))
		.map(value => value.slice(group.length + 1))
}

function hasStructuredFilters(filters: WatchlistFilterState): boolean {
	return filters.genres.size > 0 || filters.groups.size > 0
}

function dateCompare(a: WatchlistEntry, b: WatchlistEntry): number {
	return new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
}
