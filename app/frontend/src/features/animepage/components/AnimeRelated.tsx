import { PosterImage } from '@/components/anime/PosterImage'
import type { RelatedAnime } from '@/types/anime'
import { formatAnimeRating, getAnimeRatingColor } from '@/utils/animeRating'
import { createAnimeSlug } from '@/utils/animeSlug'
import { Link } from 'react-router-dom'

type AnimeRelatedProps = {
	items: RelatedAnime[]
}

export function AnimeRelated({ items }: AnimeRelatedProps) {
	if (items.length === 0) return null

	return (
		<section className='rounded-lg bg-aw-surface px-3.5 py-4'>
			<h2 className='mb-3 text-2xl font-normal leading-tight text-aw-text'>
				Связанное
			</h2>
			<div className='grid grid-cols-[repeat(auto-fill,92px)] gap-3.5'>
				{items.map(item => {
					const title = item.title_ru || item.title_en
					const slug = createAnimeSlug(
						item.id,
						item.title_en || title,
					)

					return (
						<Link
							key={item.id}
							to={`/anime/${slug}`}
							aria-label={title}
							className='block w-23 min-w-0 no-underline'
						>
							<div className='relative mb-2 aspect-3/4 overflow-hidden rounded-md bg-aw-elevated transition-transform hover:-translate-y-0.5'>
								<span
									className={`absolute left-0 top-1.5 z-2 min-w-8 rounded px-1.5 py-1 text-center text-xs font-bold leading-none ${getAnimeRatingColor(item.rating)}`}
								>
									{formatAnimeRating(item.rating)}
								</span>

								<PosterImage
									url={item.poster_url}
									title={title}
									placeholderClassName='flex h-full items-center justify-center text-2xl font-black text-white/60'
								/>

								<span className='absolute bottom-0 left-0 right-0 bg-aw-accent/90 px-1.5 py-1 text-[10px] font-medium leading-tight text-white'>
									{item.relation}
								</span>
							</div>

							<p className='m-0 line-clamp-2 text-xs leading-tight text-aw-accent'>
								{title}
							</p>
						</Link>
					)
				})}
			</div>
		</section>
	)
}
