import { AnimeCatalog } from '@/features/catalog/components/AnimeCatalog'
import { CatalogPageLayout } from '@/features/catalog/components/CatalogPageLayout'
import { setPageMeta } from '@/utils/pageMeta'
import { useEffect } from 'react'

export function CatalogPage() {
	useEffect(() => {
		setPageMeta(
			'Каталог аниме — AnimeWatch',
			'Полный каталог аниме. Сортировка по рейтингу, новизне и дате добавления. Фильтры по жанрам, типу, году и статусу.',
		)
	}, [])

	return (
		<CatalogPageLayout>
			<AnimeCatalog />
		</CatalogPageLayout>
	)
}
