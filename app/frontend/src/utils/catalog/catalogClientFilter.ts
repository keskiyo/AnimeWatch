import type { Anime } from '@/types/anime'
import type { ClientFilters, SortDirection, SortOption } from '@/types/catalog'

/** Client-side catalog filtering over the cached anime list. */
export function applyFilters(anime: Anime[], f: ClientFilters): Anime[] {
	const {
		types,
		statuses,
		ageRatings,
		episodeCounts,
		genres,
		isStrictMatch,
		fromYear,
		toYear,
	} = f

	return anime.filter(item => {
		// Type
		if (types.size > 0 && !types.has(item.type)) return false

		// Status (special-case "recent" = released in last 6 months)
		if (statuses.size > 0) {
			const includeRecent = statuses.has('recent')
			const directStatuses = new Set(
				[...statuses].filter(s => s !== 'recent'),
			)

			let ok = directStatuses.size > 0 && directStatuses.has(item.status)
			if (!ok && includeRecent) {
				const cutoff = new Date()
				cutoff.setMonth(cutoff.getMonth() - 6)
				ok = new Date(item.updated_at) >= cutoff
			}
			if (!ok) return false
		}

		// Year range
		if (item.year < fromYear || item.year > toYear) return false

		// Genres
		if (genres.size > 0) {
			const itemGenres = item.genres
			if (isStrictMatch) {
				if (![...genres].every(g => itemGenres.includes(g)))
					return false
			} else {
				if (!itemGenres.some(g => genres.has(g))) return false
			}
		}

		// Episode count
		if (episodeCounts.size > 0) {
			const ep =
				item.episodes_total > 0
					? item.episodes_total
					: item.episodes_aired
			let ok = false
			if (episodeCounts.has('Короткие') && ep > 0 && ep <= 4) ok = true
			if (episodeCounts.has('Средние') && ep >= 5 && ep <= 16) ok = true
			if (episodeCounts.has('Длинные') && ep >= 17 && ep <= 100) ok = true
			if (episodeCounts.has('Очень длинные') && ep > 100) ok = true
			if (!ok) return false
		}

		// Age rating: ageRatings holds Shikimori rating_mpaa values ("pg_13", …)
		if (ageRatings.size > 0) {
			if (!item.rating_mpaa || !ageRatings.has(item.rating_mpaa)) {
				return false
			}
		}

		return true
	})
}

/**
 * Client-side catalog sorting. The "новизне" sort excludes announced titles:
 * users expect current/newly released items there, not future placeholders. For
 * every other sort announced titles are kept, but grouped last so future years
 * do not dominate the top.
 */
export function applySort(
	anime: Anime[],
	option: SortOption,
	direction: SortDirection,
	excludeAnnounced = false,
): Anime[] {
	const source =
		option === 'новизне' && excludeAnnounced
			? anime.filter(item => item.status !== 'announced')
			: anime

	return [...source].sort((a, b) => {
		const aAnnounced = a.status === 'announced' ? 1 : 0
		const bAnnounced = b.status === 'announced' ? 1 : 0
		if (aAnnounced !== bAnnounced) return aAnnounced - bAnnounced

		let cmp = 0

		if (option === 'рейтингу') {
			cmp = b.rating - a.rating
		} else if (option === 'новизне') {
			cmp = startDateRank(b) - startDateRank(a)
			if (cmp === 0) cmp = b.year - a.year
			if (cmp === 0) {
				cmp =
					new Date(b.updated_at).getTime() -
					new Date(a.updated_at).getTime()
			}
		} else {
			// дате добавления — use id as proxy (higher id = added later)
			cmp = b.id - a.id
		}

		return direction === 'asc' ? -cmp : cmp
	})
}

function startDateRank(item: Anime): number {
	const value = item.aired_on || ''
	const timestamp = value ? Date.parse(value) : Number.NaN
	return Number.isFinite(timestamp) ? timestamp : 0
}
