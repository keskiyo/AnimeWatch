import { apiClient } from '@/api/client'
import { withFallback } from '@/api/fallback'
import type { Anime, Episode, RelatedAnime } from '@/types/anime'

// Session-scoped caches so back/forward and hover-prefetch don't refetch
// (and don't flash a skeleton on an already-seen title).
const animeCache = new Map<number, Anime | undefined>()
const relatedCache = new Map<number, RelatedAnime[]>()

export async function getAnime(id: number): Promise<Anime | undefined> {
	if (animeCache.has(id)) return animeCache.get(id)
	const data = await withFallback<Anime | undefined>(async () => {
		const response = await apiClient.get<Anime>(`/animes/${id}`)
		return response.data
	}, undefined)
	animeCache.set(id, data)
	return data
}

export async function getRelated(id: number): Promise<RelatedAnime[]> {
	if (relatedCache.has(id)) return relatedCache.get(id) as RelatedAnime[]
	const data = await withFallback(async () => {
		const response = await apiClient.get<RelatedAnime[]>(
			`/animes/${id}/related`,
		)
		return response.data
	}, [])
	relatedCache.set(id, data)
	return data
}

export async function getEpisodes(id: number): Promise<Episode[]> {
	return withFallback(async () => {
		const response = await apiClient.get<Episode[]>(
			`/animes/${id}/episodes`,
		)

		return response.data
	}, [])
}
