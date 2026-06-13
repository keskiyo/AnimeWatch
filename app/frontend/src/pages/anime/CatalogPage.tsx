import { AnimeCatalog } from '@/features/catalog/components/AnimeCatalog'
import { CatalogPageLayout } from '@/features/catalog/components/CatalogPageLayout'
import { setPageMeta } from '@/utils/pageMeta'
import { useEffect } from 'react'

export function CatalogPage() {
	useEffect(() => {
		setPageMeta({
			title: 'Каталог аниме — AnimeWatch',
			description:
				'Полный каталог аниме. Сортировка по рейтингу, новизне и дате добавления. Фильтры по жанрам, типу, году и статусу.',
			// Filters live in the query string — collapse all of them to /anime.
			canonical: '/anime',
		})
	}, [])

	return (
		<CatalogPageLayout>
			<AnimeCatalog />
		</CatalogPageLayout>
	)
}
