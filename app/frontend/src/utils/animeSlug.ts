export function createAnimeSlug(id: number, title: string): string {
	const normalizedTitle = title
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-')

	return `${id}-${normalizedTitle || 'anime'}`
}

export function parseAnimeSlugId(value: string | undefined): number | undefined {
	const id = Number(value?.match(/^\d+/)?.[0])

	return Number.isInteger(id) && id > 0 ? id : undefined
}
