import { stripBBCode } from '@/utils/animePageFormatters'
import { proxyImage } from '@/utils/imageProxy'

const SITE_NAME = 'AnimeWatch'
const DEFAULT_DESCRIPTION =
	'AnimeWatch — каталог аниме, онгоингов и страниц тайтлов.'
const DEFAULT_IMAGE = '/AnimeWatch.png'
// JSON-LD is the only tag we recreate per navigation; everything else is
// upserted so static tags from index.html stay single (no duplicates).
const MANAGED_LD = 'data-managed-ld'

export type PageMeta = {
	title: string
	description?: string
	/** Canonical path or absolute URL. Default = origin + pathname (drops the
	 *  query string, collapsing filtered/duplicate URLs). `null` omits the tag. */
	canonical?: string | null
	/** True → noindex,nofollow (private/utility/404 pages). */
	noindex?: boolean
	ogType?: string
	/** Raw image URL (proxied automatically if hotlink-protected). */
	image?: string
	jsonLd?: object | object[] | null
}

/** Set the document head. Back-compatible: `setPageMeta(title, description)`. */
export function setPageMeta(input: string | PageMeta, description?: string) {
	const meta: PageMeta =
		typeof input === 'string' ? { title: input, description } : input

	document.title = meta.title
	const desc = cleanDescription(meta.description)
	upsertMeta('name', 'description', desc)
	upsertMeta('name', 'robots', meta.noindex ? 'noindex, nofollow' : 'index, follow')

	const canonical =
		meta.canonical === null
			? null
			: toAbsolute(meta.canonical ?? window.location.pathname)
	setCanonical(canonical)

	const url = canonical ?? toAbsolute(window.location.pathname)
	const image = toAbsolute(meta.image ? proxyImage(meta.image) : DEFAULT_IMAGE)
	upsertMeta('property', 'og:site_name', SITE_NAME)
	upsertMeta('property', 'og:type', meta.ogType ?? 'website')
	upsertMeta('property', 'og:title', meta.title)
	upsertMeta('property', 'og:description', desc)
	upsertMeta('property', 'og:url', url)
	upsertMeta('property', 'og:image', image)
	upsertMeta('name', 'twitter:card', 'summary_large_image')
	upsertMeta('name', 'twitter:title', meta.title)
	upsertMeta('name', 'twitter:description', desc)
	upsertMeta('name', 'twitter:image', image)

	setJsonLd(meta.jsonLd ?? null)
}

function cleanDescription(text: string | undefined): string {
	if (!text) return DEFAULT_DESCRIPTION
	const plain = stripBBCode(text)
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
	if (!plain) return DEFAULT_DESCRIPTION
	return plain.length > 160 ? `${plain.slice(0, 157).trimEnd()}…` : plain
}

function toAbsolute(value: string): string {
	if (/^https?:\/\//.test(value)) return value
	const path = value.startsWith('/') ? value : `/${value}`
	return `${window.location.origin}${path}`
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
	let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
	if (!el) {
		el = document.createElement('meta')
		el.setAttribute(attr, key)
		document.head.appendChild(el)
	}
	el.setAttribute('content', content)
}

function setCanonical(href: string | null) {
	let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
	if (!href) {
		el?.remove()
		return
	}
	if (!el) {
		el = document.createElement('link')
		el.rel = 'canonical'
		document.head.appendChild(el)
	}
	el.href = href
}

function setJsonLd(data: object | object[] | null) {
	document.head.querySelectorAll(`[${MANAGED_LD}]`).forEach(el => el.remove())
	if (!data) return
	const script = document.createElement('script')
	script.type = 'application/ld+json'
	script.setAttribute(MANAGED_LD, '')
	script.textContent = JSON.stringify(data)
	document.head.appendChild(script)
}
