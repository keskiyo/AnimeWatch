// Shikimori blocks cross-origin image hotlinking and returns a "404" placeholder.
// Routing those images through our backend proxy (which sends a valid Referer)
// makes them load reliably and from our own origin (no browser-cache poisoning).

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

// shikimori.one — old domain, hotlink-protected; route via backend proxy
// shikimori.io  — new CDN domain (GQL poster URLs), loads freely — NO proxy needed
const PROXIED_HOSTS = ['shikimori.one', 'shikimori.org']

/**
 * Wrap a Shikimori image URL so it is fetched via the backend proxy.
 * Non-Shikimori URLs (e.g. Kodik screenshots) are returned unchanged.
 */
export function proxyImage(url: string | undefined | null): string {
	if (!url) return ''
	try {
		const { host } = new URL(url)
		const needsProxy = PROXIED_HOSTS.some(
			h => host === h || host.endsWith(`.${h}`),
		)
		if (!needsProxy) return url
		return `${API_BASE_URL}/image-proxy?url=${encodeURIComponent(url)}`
	} catch {
		return url
	}
}
