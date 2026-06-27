import { CatalogBody } from '@/features/catalog/components/grid/CatalogBody'
import { useAnimeCache } from '@/features/catalog/hooks/useAnimeCache'
import { useAnimeCatalog } from '@/features/catalog/hooks/useAnimeCatalog'
import { LoadMore } from '@/features/components/LoadMore'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { genreSlug } from '@/utils/anime/animeSlug'
import { parseClientFilters } from '@/utils/catalog/catalogFilters'
import { setPageMeta } from '@/utils/pageMeta'
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

/** SEO landing page for a single genre: /anime/zhanr/:genreSlug */
export function GenrePage() {
	const { genreSlug: slug } = useParams()
	const { anime, isComplete } = useAnimeCache()

	// Resolve the genre name from the slug using genres present in the catalog.
	const genreName = useMemo(() => {
		if (!slug) return null
		const all = new Set<string>()
		for (const item of anime) for (const g of item.genres ?? []) all.add(g)
		return [...all].find(g => genreSlug(g) === slug) ?? null
	}, [anime, slug])

	const filters = useMemo(() => {
		const base = parseClientFilters(new URLSearchParams())
		return { ...base, genres: new Set(genreName ? [genreName] : []) }
	}, [genreName])

	const catalog = useAnimeCatalog('poster', 'рейтингу', 'desc', filters)

	useEffect(() => {
		if (!genreName) return
		setPageMeta({
			title: `Аниме ${genreName} — смотреть онлайн | AnimeWatch`,
			description: `Аниме в жанре ${genreName}: смотрите онлайн бесплатно. Полный список тайтлов с рейтингом.`,
			canonical: `/anime/zhanr/${slug}`,
		})
	}, [genreName, slug])

	if (isComplete && !genreName) {
		return (
			<NotFoundPage
				title='Жанр не найден'
				message='Такого жанра нет в каталоге.'
			/>
		)
	}

	return (
		<main className='mx-auto max-w-345 px-4 py-6.5 pb-10'>
			<h1 className='mb-5 text-2xl font-bold text-aw-text'>
				Аниме в жанре «{genreName ?? '…'}»
			</h1>
			<section className='min-w-0 rounded-lg bg-aw-surface px-3.75 pb-7 pt-4'>
				<CatalogBody viewMode='poster' catalog={catalog} />
				<LoadMore
					onClick={catalog.loadMore}
					isLoading={catalog.isLoadingMore}
					hasMore={
						!catalog.isInitialLoading &&
						!catalog.error &&
						catalog.hasMore
					}
					isAutoLoadEnabled={false}
				/>
			</section>
		</main>
	)
}
