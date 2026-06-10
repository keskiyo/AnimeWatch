import { apiClient } from '@/api/client'
import { withFallback } from '@/api/fallback'
import type { KodikPlayer } from '@/types/anime'

export async function getKodikPlayer(
	animeId: number,
	episodeNumber = 1,
): Promise<KodikPlayer> {
	return withFallback(
		async () => {
			const response = await apiClient.get<KodikPlayer>(
				`/player/kodik/${animeId}/${episodeNumber}`,
			)

			return response.data
		},
		{
			available: false,
			provider: 'kodik',
			message: 'Kodik player is unavailable',
		},
	)
}
