export type StaticPagePart =
	| { type: 'text'; value: string }
	| { type: 'link'; value: string; href: string }

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

export function parseStaticPageLinks(text: string): StaticPagePart[] {
	const parts: StaticPagePart[] = []
	let index = 0

	for (const match of text.matchAll(LINK_RE)) {
		const matchIndex = match.index ?? 0
		if (matchIndex > index) {
			parts.push({ type: 'text', value: text.slice(index, matchIndex) })
		}
		const source = match[0] ?? ''
		const label = match[1] ?? ''
		const href = match[2] ?? ''
		if (isSafeHref(href)) {
			parts.push({ type: 'link', value: label, href })
		} else {
			parts.push({ type: 'text', value: source })
		}
		index = matchIndex + source.length
	}

	if (index < text.length) parts.push({ type: 'text', value: text.slice(index) })
	return mergeTextParts(parts.length > 0 ? parts : [{ type: 'text', value: text }])
}

function isSafeHref(href: string): boolean {
	try {
		const url = new URL(href, 'https://animewatch.local')
		return SAFE_PROTOCOLS.has(url.protocol)
	} catch {
		return false
	}
}

function mergeTextParts(parts: StaticPagePart[]): StaticPagePart[] {
	return parts.reduce<StaticPagePart[]>((result, part) => {
		const previous = result.at(-1)
		if (previous?.type === 'text' && part.type === 'text') {
			previous.value += part.value
		} else {
			result.push(part)
		}
		return result
	}, [])
}
