import type { SortOption } from '@/types/catalog'

// ─── Sort option (RU label) ↔ URL param value ────────────────────────────────

export const SORT_TO_PARAM: Record<SortOption, string> = {
	новизне: 'startDate',
	'дате добавления': 'createdAt',
	рейтингу: 'rating',
}

export const SORT_FROM_PARAM: Record<string, SortOption> = {
	startDate: 'новизне',
	createdAt: 'дате добавления',
	rating: 'рейтингу',
}

// ─── Filter group → API param name ───────────────────────────────────────────
// Keys must match group.title values from filterGroups in catalogData.ts

export const GROUP_TO_PARAM: Record<string, string> = {
	Тип: 'type',
	Статус: 'status',
	Сезон: 'season',
}

// ─── UI label ↔ API value ────────────────────────────────────────────────────

export const LABEL_TO_API: Record<string, string> = {
	Сериал: 'tv',
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

export const API_TO_LABEL = Object.fromEntries(
	Object.entries(LABEL_TO_API).map(([label, api]) => [api, label]),
) as Record<string, string>

/**
 * Toggle a value inside a multi-value search param (append when absent,
 * remove when present). Mutates the given URLSearchParams in place.
 */
export function toggleParamValue(
	params: URLSearchParams,
	name: string,
	value: string,
): void {
	const current = params.getAll(name)
	params.delete(name)
	if (current.includes(value)) {
		current.filter(v => v !== value).forEach(v => params.append(name, v))
	} else {
		;[...current, value].forEach(v => params.append(name, v))
	}
}
