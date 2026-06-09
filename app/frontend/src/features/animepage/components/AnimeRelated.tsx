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
			<div className='grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-3 max-[640px]:grid-cols-2'>
				{items.map(item => {
					const title = item.title_ru || item.title_en
					const slug = createAnimeSlug(item.id, item.title_en || title)

					return (
						<Link
							key={item.id}
							to={`/anime/${slug}`}
							aria-label={title}
							className='block min-w-0 no-underline'
						>
							<div className='relative mb-2 aspect-3/4 overflow-hidden rounded-md bg-aw-elevated transition-transform hover:-translate-y-0.5'>
								<span
									className={`absolute left-0 top-2 z-2 min-w-10.5 rounded px-2 py-1.5 text-center text-[15px] font-bold leading-none ${getAnimeRatingColor(item.rating)}`}
								>
									{formatAnimeRating(item.rating)}
								</span>
								{item.poster_url ? (
									<img
										src={item.poster_url}
										alt={`${title} poster`}
										className='h-full w-full object-cover'
										loading='lazy'
									/>
								) : (
									<span className='flex h-full items-center justify-center text-3xl font-black text-white/60'>
										{title.slice(0, 2).toUpperCase()}
									</span>
								)}
								<span className='absolute bottom-0 left-0 right-0 bg-aw-accent/90 px-2 py-1 text-xs font-medium text-white'>
									{item.relation}
								</span>
							</div>
							<p className='m-0 line-clamp-2 text-sm leading-tight text-aw-accent'>
								{title}
							</p>
						</Link>
					)
				})}
			</div>
		</section>
	)
}
