import { apiClient } from '@/api/client'
import { withFallback } from '@/api/fallback'
import type { AppSettings } from '@/types/anime'

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
