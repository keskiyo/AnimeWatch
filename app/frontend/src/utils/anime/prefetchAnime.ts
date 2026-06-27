import { getAnime } from '@/api/animeApi'

let pageChunk: Promise<unknown> | null = null
const warmed = new Set<number>()

/**
 * Warm up a title before the user clicks: load the AnimePage code chunk once
 * and prefetch the detail data (cached in animeApi). Called on card hover/focus
 * so navigation feels instant. Cheap + idempotent — safe to call repeatedly.
 */
export function prefetchAnimePage(id: number): void {
	pageChunk ??= import('@/pages/anime/AnimePage')
	if (id > 0 && !warmed.has(id)) {
		warmed.add(id)
		void getAnime(id)
	}
}
