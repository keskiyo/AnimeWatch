// Cyrillic → Latin so Russian-only titles still get a readable slug
// (e.g. «Магическая битва» → "magicheskaya-bitva") instead of falling back
// to "anime". MUST stay identical to backend services/seo.py `_translit`.
const CYRILLIC: Record<string, string> = {
	а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
	з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
	п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
	ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

function transliterate(text: string): string {
	return text.toLowerCase().replace(/[а-яё]/g, ch => CYRILLIC[ch] ?? ch)
}

function kebab(text: string): string {
	return transliterate(text)
		.normalize('NFKD')
		.replace(new RegExp('[\\u0300-\\u036f]', 'g'), '') // strip diacritics
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-')
}

export function createAnimeSlug(id: number, title: string): string {
	return `${id}-${kebab(title) || 'anime'}`
}

/** URL slug for a genre landing page — MUST match backend services/seo.py. */
export function genreSlug(name: string): string {
	return kebab(name) || 'anime'
}

export function parseAnimeSlugId(value: string | undefined): number | undefined {
	const id = Number(value?.match(/^\d+/)?.[0])

	return Number.isInteger(id) && id > 0 ? id : undefined
}
