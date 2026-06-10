/** Set document title and the meta description tag (created on demand). */
export function setPageMeta(title: string, description?: string) {
	document.title = title

	if (!description) return
	let meta = document.querySelector<HTMLMetaElement>(
		'meta[name="description"]',
	)
	if (!meta) {
		meta = document.createElement('meta')
		meta.name = 'description'
		document.head.appendChild(meta)
	}
	meta.content = description
}
