import { apiClient } from '@/api/client'
import { withFallback } from '@/api/fallback'
import type { KodikPlayer } from '@/types/anime'
import type {
	AnimegoVoices,
	PlayerProvider,
	StreamSource,
} from '@/types/animePage'

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

export async function getAnimegoVoices(
	animeId: number,
	episodeNumber: number,
): Promise<AnimegoVoices> {
	return withFallback(
		async () => {
			const response = await apiClient.get<AnimegoVoices>(
				`/player/animego/${animeId}/${episodeNumber}`,
			)
			return response.data
		},
		{
			available: false,
			provider: 'animego',
			message: 'AnimeGO недоступен',
		},
	)
}

export async function getAnimegoStream(
	animeId: number,
	episodeNumber: number,
	streamRef: string,
	playerType: 'aniboom' | 'cvh',
): Promise<StreamSource> {
	return withFallback<StreamSource>(
		async () => {
			const response = await apiClient.get<StreamSource>(
				`/player/animego/stream/${animeId}/${episodeNumber}`,
				{ params: { voice: streamRef, type: playerType } },
			)
			return response.data
		},
		{ kind: 'unsupported' },
	)
}

export async function getPlayerProviders(
	animeId: number,
): Promise<PlayerProvider[]> {
	return withFallback(
		async () => {
			const response = await apiClient.get<{
				providers: PlayerProvider[]
			}>(`/player/providers/${animeId}`)
			return response.data.providers
		},
		[],
	)
}
