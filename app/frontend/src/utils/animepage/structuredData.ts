import type { Anime } from '@/types/anime'
import { proxyImage } from '@/utils/anime/imageProxy'

function absolute(path: string): string {
	return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * schema.org graph for an anime detail page: the work itself (Movie/TVSeries)
 * plus a breadcrumb trail. Improves rich-result eligibility.
 */
export function animeJsonLd(anime: Anime, canonicalPath: string): object {
	const url = absolute(canonicalPath)
	const name = anime.title_ru || anime.title_en || 'Аниме'
	const work: Record<string, unknown> = {
		'@type': anime.type === 'movie' ? 'Movie' : 'TVSeries',
		name,
		url,
		inLanguage: 'ru',
	}
	if (anime.title_en && anime.title_en !== name) work.alternateName = anime.title_en
	const image = proxyImage(anime.poster_url)
	if (image) work.image = /^https?:\/\//.test(image) ? image : absolute(image)
	if (anime.description) work.description = anime.description.slice(0, 500)
	if (anime.year) work.datePublished = String(anime.year)
	if (anime.genres?.length) work.genre = anime.genres
	if (anime.rating > 0 && anime.score_count > 0) {
		work.aggregateRating = {
			'@type': 'AggregateRating',
			ratingValue: anime.rating,
			ratingCount: anime.score_count,
			bestRating: 10,
			worstRating: 1,
		}
	}

	return {
		'@context': 'https://schema.org',
		'@graph': [
			work,
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Главная', item: absolute('/') },
					{ '@type': 'ListItem', position: 2, name: 'Каталог', item: absolute('/anime') },
					{ '@type': 'ListItem', position: 3, name, item: url },
				],
			},
		],
	}
}
