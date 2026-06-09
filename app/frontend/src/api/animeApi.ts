import { apiClient } from '@/api/client'
import type {
	Anime,
	AppNotification,
	AppSettings,
	CatalogResult,
	Episode,
	KodikPlayer,
	RelatedAnime,
	ScheduleEntry,
	WatchlistEntry,
	WatchlistStatus,
} from '@/types/anime'

export type CatalogParams = {
	search?: string
	genres?: string
	status?: string
	year_from?: string
	year_to?: string
	season?: string
	type?: string
	sort?: string
	direction?: 'asc' | 'desc'
	page?: string
	limit?: string
	age_rating?: string
}

function shouldUseFallback() {
	const envFallback = import.meta.env.VITE_USE_FALLBACK === 'true'

	if (typeof window === 'undefined') {
		return envFallback
	}

	const localFallback = localStorage.getItem('useFallback') === 'true'

	return envFallback || localFallback
}

async function withFallback<T>(
	request: () => Promise<T>,
	fallback: T,
): Promise<T> {
	if (shouldUseFallback()) {
		return fallback
	}

	try {
		return await request()
	} catch (error) {
		console.warn('API request failed, fallback used:', error)
		return fallback
	}
}

export async function getCatalog(
	params: CatalogParams = {},
): Promise<CatalogResult> {
	return withFallback(
		async () => {
			const response = await apiClient.get<CatalogResult>('/anime', {
				params,
			})

			return response.data
		},
		{
			data: [],
			total: 0,
			page: Number(params.page) || 1,
		},
	)
}

export async function getBulkCatalog(): Promise<CatalogResult> {
	return withFallback(
		async () => {
			const response = await apiClient.get<CatalogResult>('/anime/bulk')
			return response.data
		},
		{ data: [], total: 0, page: 1 },
	)
}

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

export async function getSchedule(): Promise<Record<string, ScheduleEntry[]>> {
	return withFallback(async () => {
		const response =
			await apiClient.get<Record<string, ScheduleEntry[]>>('/schedule')

		return response.data
	}, {})
}

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

export async function getNotifications(): Promise<AppNotification[]> {
	return withFallback(async () => {
		const response = await apiClient.get<AppNotification[]>(
			'/notifications',
			{ params: { unread_only: true } },
		)

		return response.data
	}, [])
}

export async function getSettings(): Promise<AppSettings> {
	return withFallback(async () => {
		const response = await apiClient.get<AppSettings>('/settings')
		return response.data
	}, {} as AppSettings)
}

export async function saveSettings(
	settings: AppSettings,
): Promise<AppSettings> {
	return withFallback(async () => {
		const response = await apiClient.put<{ settings: AppSettings }>(
			'/settings',
			settings,
		)

		return response.data.settings
	}, settings)
}
