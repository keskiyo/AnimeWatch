import { CatalogPageLayout } from '@/features/catalog/components/CatalogPageLayout'
import { OngoingCatalog } from '@/features/ongoing/components/OngoingCatalog'
import { setPageMeta } from '@/utils/pageMeta'
import { useEffect } from 'react'

export function CatalogOngoingPage() {
	useEffect(() => {
		setPageMeta(
			'Онгоинги — AnimeWatch',
			'Список текущих онгоингов. Смотрите новые серии аниме в хорошем качестве на AnimeWatch.',
		)
	}, [])

	return (
		<CatalogPageLayout>
			<OngoingCatalog />
		</CatalogPageLayout>
	)
}
