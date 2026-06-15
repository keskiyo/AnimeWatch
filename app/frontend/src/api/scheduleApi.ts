import { apiClient } from '@/api/client'
import { withFallback } from '@/api/fallback'
import type { Anime, ScheduleEntry } from '@/types/anime'

export async function getSchedule(): Promise<Record<string, ScheduleEntry[]>> {
	return withFallback(async () => {
		const response =
			await apiClient.get<Record<string, ScheduleEntry[]>>('/schedule')

		return response.data
	}, {})
}

/** New ongoings for the home rail: recently-started, not long-runners, newest first. */
export async function getHomeSeasonAnime(limit?: number): Promise<Anime[]> {
	return withFallback(async () => {
		const response = await apiClient.get<Anime[]>('/home/season', {
			params: { limit },
		})

		return response.data
	}, [])
}
