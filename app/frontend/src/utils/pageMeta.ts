/** Set document title and the meta description tag (created on demand). */
const DEFAULT_DESCRIPTION =
	'AnimeWatch - каталог аниме, онгоингов и страниц тайтлов.'

export function setPageMeta(title: string, description?: string) {
	document.title = title

	let meta = document.querySelector<HTMLMetaElement>(
		'meta[name="description"]',
	)
	if (!meta) {
		meta = document.createElement('meta')
		meta.name = 'description'
		document.head.appendChild(meta)
	}
	meta.content = description?.trim() || DEFAULT_DESCRIPTION
}
