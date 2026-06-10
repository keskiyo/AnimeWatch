import { apiClient } from '@/api/client'
import { withFallback } from '@/api/fallback'
import type { WatchlistEntry, WatchlistStatus } from '@/types/anime'

export async function getWatchlist(): Promise<WatchlistEntry[]> {
	return withFallback(async () => {
		const response = await apiClient.get<WatchlistEntry[]>('/watchlist')
		return response.data
	}, [])
}

export async function addToWatchlist(
	animeId: number,
	status: WatchlistStatus,
	favorite: boolean,
): Promise<WatchlistEntry> {
	return withFallback(
		async () => {
			const response = await apiClient.post<WatchlistEntry>(
				'/watchlist',
				{
					anime_id: animeId,
					status,
					favorite,
				},
			)

			return response.data
		},
		{
			anime_id: animeId,
			added_at: new Date().toISOString(),
			status,
			favorite,
			notifications_enabled: true,
		},
	)
}

export async function markEpisodeWatched(
	animeId: number,
	episodeNumber: number,
): Promise<void> {
	await withFallback(async () => {
		await apiClient.post('/progress', {
			anime_id: animeId,
			episode_number: episodeNumber,
			watched: true,
		})
	}, undefined)
}
