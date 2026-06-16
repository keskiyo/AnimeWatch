import type { ClientFilters } from '@/types/catalog'

const CURRENT_YEAR = new Date().getFullYear()

export const TYPE_MAP: Record<string, string> = {
	Сериал: 'tv',
	Фильм: 'movie',
	OVA: 'ova',
	ONA: 'ona',
	Спешл: 'special',
}

export const STATUS_MAP: Record<string, string> = {
	Онгоинг: 'ongoing',
	Вышел: 'released',
	Анонс: 'announced',
	Недавно: 'recent',
}

// UI label → Shikimori rating_mpaa values ("g","pg","pg_13","r","r_plus","rx")
export const AGE_RATING_MAP: Record<string, string[]> = {
	G: ['g'],
	PG: ['pg'],
	'PG-13': ['pg_13'],
	'R-17': ['r'],
	'R+': ['r_plus', 'rx'],
}

/** Parse the catalog URL search params into the client-side filter set. */
export function parseClientFilters(
	searchParams: URLSearchParams,
): ClientFilters {
	const checkedRaw = searchParams.get('f')?.split(',').filter(Boolean) ?? []
	const genres = new Set(
		searchParams.get('genres')?.split(',').filter(Boolean) ?? [],
	)
	const isStrictMatch = searchParams.get('strict') === '1'
	const fromYear = Number(searchParams.get('fromYear') ?? '1980')
	const toYear = Number(searchParams.get('toYear') ?? CURRENT_YEAR)

	const types = new Set<string>()
	const statuses = new Set<string>()
	const ageRatings = new Set<string>()
	const episodeCounts = new Set<string>()

	for (const item of checkedRaw) {
		const colonIdx = item.indexOf(':')
		if (colonIdx < 0) continue
		const category = item.slice(0, colonIdx)
		const value = item.slice(colonIdx + 1)

		if (category === 'Тип') {
			const mapped = TYPE_MAP[value]
			if (mapped) types.add(mapped)
		} else if (category === 'Статус') {
			const mapped = STATUS_MAP[value]
			if (mapped) statuses.add(mapped)
		} else if (category === 'Возрастное ограничение') {
			// Map the UI label (e.g. "PG-13") to real Shikimori values ("pg_13")
			for (const mpaa of AGE_RATING_MAP[value] ?? []) {
				ageRatings.add(mpaa)
			}
		} else if (category === 'Количество серий') {
			episodeCounts.add(value)
		}
	}

	return {
		types,
		statuses,
		ageRatings,
		episodeCounts,
		genres,
		isStrictMatch,
		fromYear,
		toYear,
	}
}
