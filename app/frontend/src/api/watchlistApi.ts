import { authHeaders } from '@/api/authApi'
import { apiClient } from '@/api/client'
import { withFallback } from '@/api/fallback'
import type { WatchlistEntry, WatchlistStatus } from '@/types/anime'

export type WatchlistToggleResult = {
	user_id: number
	anime_id: number
	status: WatchlistStatus
	active: boolean
	statuses: WatchlistStatus[]
	anime?: WatchlistEntry['anime']
}

export async function getWatchlist(): Promise<WatchlistEntry[]> {
	return withFallback(async () => {
		const response = await apiClient.get<WatchlistEntry[]>('/watchlist', {
			headers: authHeaders(),
		})
		return response.data
	}, [])
}

export async function getUserWatchlist(
	userId: number,
): Promise<WatchlistEntry[]> {
	return withFallback(async () => {
		const response = await apiClient.get<WatchlistEntry[]>(
			`/users/${userId}/watchlist`,
		)
		return response.data
	}, [])
}

export async function toggleWatchlistStatus(
	animeId: number,
	status: WatchlistStatus,
): Promise<WatchlistToggleResult> {
	const response = await apiClient.post<WatchlistToggleResult>(
		'/watchlist/toggle',
		{
			anime_id: animeId,
			status,
		},
		{ headers: authHeaders() },
	)

	return response.data
}

export const addToWatchlist = toggleWatchlistStatus

export async function markEpisodeWatched(
	animeId: number,
	episodeNumber: number,
): Promise<void> {
	await withFallback(async () => {
		await apiClient.post(
			'/progress',
			{
				anime_id: animeId,
				episode_number: episodeNumber,
				watched: true,
			},
			{ headers: authHeaders() },
		)
	}, undefined)
}
