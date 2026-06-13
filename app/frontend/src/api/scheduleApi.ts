import { apiClient } from '@/api/client'
import { withFallback } from '@/api/fallback'
import type { Anime, ScheduleEntry, ScheduleResponse } from '@/types/anime'
import { selectNewOngoings } from '@/utils/homeRail'

export async function getSchedule(): Promise<Record<string, ScheduleEntry[]>> {
	return withFallback(async () => {
		const response =
			await apiClient.get<Record<string, ScheduleEntry[]>>('/schedule')

		return response.data
	}, {})
}

/** Flatten a schedule response into a unique anime list (insertion order). */
export function scheduleToAnimeList(
	schedule: ScheduleResponse,
	limit?: number,
): Anime[] {
	const animeById = new Map<number, Anime>()

	Object.values(schedule)
		.flat()
		.forEach(item => {
			if (!item.anime) return

			if (!animeById.has(item.anime.id)) {
				animeById.set(item.anime.id, item.anime)
			}
		})

	const result = Array.from(animeById.values())

	return typeof limit === 'number' ? result.slice(0, limit) : result
}

/** New ongoings for the home rail: recently-started, not long-runners, newest first. */
export async function getHomeSeasonAnime(limit?: number): Promise<Anime[]> {
	return withFallback(async () => {
		const schedule = await getSchedule()

		return selectNewOngoings(scheduleToAnimeList(schedule), limit)
	}, [])
}
