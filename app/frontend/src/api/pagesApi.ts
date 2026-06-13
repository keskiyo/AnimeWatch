import { apiClient } from '@/api/client'
import type { StaticPage, StaticPageSlug } from '@/types/staticPage'

export async function getStaticPage(slug: StaticPageSlug): Promise<StaticPage> {
	const response = await apiClient.get<StaticPage>(`/pages/${slug}`)
	return response.data
}
