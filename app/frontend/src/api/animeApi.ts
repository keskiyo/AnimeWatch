import { apiClient } from '@/api/client'
import { withFallback } from '@/api/fallback'
import type { Anime, Episode, RelatedAnime } from '@/types/anime'

export async function getAnime(id: number): Promise<Anime | undefined> {
	return withFallback<Anime | undefined>(async () => {
		const response = await apiClient.get<Anime>(`/animes/${id}`)
		return response.data
	}, undefined)
}

export async function getRelated(id: number): Promise<RelatedAnime[]> {
	return withFallback(async () => {
		const response = await apiClient.get<RelatedAnime[]>(
			`/animes/${id}/related`,
		)
		return response.data
	}, [])
}

export async function getEpisodes(id: number): Promise<Episode[]> {
	return withFallback(async () => {
		const response = await apiClient.get<Episode[]>(
			`/animes/${id}/episodes`,
		)

		return response.data
	}, [])
}
