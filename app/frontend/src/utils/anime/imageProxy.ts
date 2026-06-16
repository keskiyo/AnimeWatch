// Shikimori blocks cross-origin image hotlinking and returns a "404" placeholder.
// Routing those images through our backend proxy (which sends a valid Referer)
// makes them load reliably and from our own origin (no browser-cache poisoning).

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

// shikimori.one — old domain, hotlink-protected; route via backend proxy
// shikimori.io  — loads freely, but goes through proxy when resized posters are requested
const PROXIED_HOSTS = ['shikimori.io', 'shikimori.one', 'shikimori.org']

type ProxyImageOptions = {
	width?: number
}

/**
 * Wrap a Shikimori image URL so it is fetched via the backend proxy.
 * Non-Shikimori URLs (e.g. Kodik screenshots) are returned unchanged.
 */
export function proxyImage(
	url: string | undefined | null,
	options: ProxyImageOptions = {},
): string {
	if (!url) return ''
	try {
		const { host } = new URL(url)
		const needsProxy = PROXIED_HOSTS.some(
			h => host === h || host.endsWith(`.${h}`),
		)
		if (!needsProxy || (!options.width && host.includes('shikimori.io'))) {
			return url
		}

		const proxiedUrl = new URL(`${API_BASE_URL}/image-proxy`)
		proxiedUrl.searchParams.set('url', url)
		if (options.width) proxiedUrl.searchParams.set('w', String(options.width))
		return proxiedUrl.toString()
	} catch {
		return url
	}
}
