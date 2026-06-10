import { apiClient } from '@/api/client'
import { withFallback } from '@/api/fallback'
import type { CatalogResult } from '@/types/anime'

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

export async function getStudioAnime(
	studioName: string,
): Promise<CatalogResult> {
	return withFallback(
		async () => {
			const response = await apiClient.get<CatalogResult>(
				`/studio/${encodeURIComponent(studioName)}/anime`,
			)
			return response.data
		},
		{ data: [], total: 0, page: 1 },
	)
}

export async function getDubbingAnime(
	translationId: number,
): Promise<CatalogResult> {
	return withFallback(
		async () => {
			const response = await apiClient.get<CatalogResult>(
				`/dubbing/${translationId}/anime`,
			)
			return response.data
		},
		{ data: [], total: 0, page: 1 },
	)
}
