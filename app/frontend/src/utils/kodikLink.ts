/**
 * Kodik iframe URL helpers.
 *
 * Serial links look like `https://kodik.info/serial/<id>/<hash>/720p`.
 * The player accepts query params to open a specific episode without
 * touching its built-in selector: `?episode=N` (and `season=N` if needed).
 */

/** Build the iframe URL for a given dubbing-track link and episode number. */
export function buildKodikEpisodeLink(
	baseLink: string | undefined | null,
	episode?: number,
): string {
	if (!baseLink) return ''

	try {
		const url = new URL(baseLink)
		// Episode param only makes sense for serial players; movie links
		// (`/video/...`) are left untouched.
		if (episode && episode > 0 && url.pathname.includes('/serial/')) {
			url.searchParams.set('episode', String(episode))
		}
		return url.toString()
	} catch {
		return baseLink
	}
}
