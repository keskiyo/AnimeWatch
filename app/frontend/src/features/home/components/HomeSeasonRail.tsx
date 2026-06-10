import { PosterImage } from '@/components/anime/PosterImage'
import type { Anime } from '@/types/anime'
import { formatAnimeRating, getAnimeRatingColor } from '@/utils/animeRating'
import { createAnimeSlug } from '@/utils/animeSlug'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'

type HomeSeasonRailProps = {
	anime: Anime[]
	isLoading: boolean
}

const SCROLL_BUTTON =
	'pointer-events-none absolute top-28 z-3 inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-0 bg-[rgba(36,37,38,0.92)] text-aw-text opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-[rgba(49,50,51,0.98)]'

/** Horizontal scrollable rail of new-season anime cards on the home page. */
export function HomeSeasonRail({ anime, isLoading }: HomeSeasonRailProps) {
	const railRef = useRef<HTMLDivElement>(null)

	function scroll(direction: 'left' | 'right') {
		railRef.current?.scrollBy({
			behavior: 'smooth',
			left: direction === 'left' ? -420 : 420,
		})
	}

	return (
		<div className='group relative'>
			<button
				type='button'
				className={`${SCROLL_BUTTON} left-3`}
				aria-label='Прокрутить сезон влево'
				onClick={() => scroll('left')}
			>
				<ChevronLeft size={28} aria-hidden='true' />
			</button>
			<div
				ref={railRef}
				className='grid auto-cols-[minmax(150px,178px)] grid-flow-col gap-6 overflow-x-auto scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden'
			>
				{isLoading ? (
					<div className='col-span-full py-16 text-aw-subtle'>
						Загрузка аниме...
					</div>
				) : (
					anime.map(item => {
						const title = item.title_ru || item.title_en

						return (
							<Link
								key={item.id}
								to={`/anime/${createAnimeSlug(item.id, item.title_en || title)}`}
								aria-label={title}
								className='relative grid min-w-0 no-underline'
							>
								<span
									className={`absolute left-0 top-2 z-1 min-w-10.5 rounded px-2 py-1.5 text-center text-[15px] font-bold leading-none ${getAnimeRatingColor(item.rating)}`}
								>
									{formatAnimeRating(item.rating)}
								</span>
								<span className='block h-62.5 w-full overflow-hidden rounded-md bg-aw-surface aspect-2/3'>
									<PosterImage
										url={item.poster_url}
										title={title}
										maxRetries={5}
										retryDelay={2000}
									/>
								</span>
								<small className='mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-aw-text'>
									{item.title_en}
								</small>
								<strong className='mt-1 line-clamp-2 overflow-hidden text-lg font-normal leading-tight text-aw-accent'>
									{title}
								</strong>
							</Link>
						)
					})
				)}
			</div>
			<button
				type='button'
				className={`${SCROLL_BUTTON} right-3`}
				aria-label='Прокрутить сезон вправо'
				onClick={() => scroll('right')}
			>
				<ChevronRight size={28} aria-hidden='true' />
			</button>
		</div>
	)
}
