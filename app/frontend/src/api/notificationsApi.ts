import { apiClient } from '@/api/client'
import { withFallback } from '@/api/fallback'
import type { AppNotification } from '@/types/anime'

export async function getNotifications(): Promise<AppNotification[]> {
	return withFallback(async () => {
		const response = await apiClient.get<AppNotification[]>(
			'/notifications',
			{ params: { unread_only: true } },
		)

		return response.data
	}, [])
}
