import { getCatalog } from '@/api/animeApi'
import type { Anime } from '@/types/anime'
import { formatAnimeRating } from '@/utils/animeRating'
import { createAnimeSlug } from '@/utils/animeSlug'
import {
	HOME_ADVANTAGES,
	HOME_FREE_PARAGRAPHS,
	HOME_FREE_TITLE,
	HOME_INTRO_PARAGRAPHS,
	HOME_INTRO_TITLE,
} from '@/utils/catalogData'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export function HomePage() {
	const railRef = useRef<HTMLDivElement>(null)
	const [anime, setAnime] = useState<Anime[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		let isCancelled = false

		async function loadHomeAnime() {
			setIsLoading(true)
			const result = await getCatalog({
				limit: '12',
				page: '1',
				sort: 'novelty',
				order: 'desc',
			})

			if (!isCancelled) {
				setAnime(result.data)
				setIsLoading(false)
			}
		}

		void loadHomeAnime()

		return () => {
			isCancelled = true
		}
	}, [])

	function onClickScrollSeason(direction: 'left' | 'right') {
		railRef.current?.scrollBy({
			behavior: 'smooth',
			left: direction === 'left' ? -420 : 420,
		})
	}

	return (
		<main className='mx-auto max-w-345 px-4 py-6.5 pb-9'>
			<section
				className='mb-8.5 overflow-hidden'
				aria-labelledby='season-title'
			>
				<div className='mb-3.5 flex items-center justify-between'>
					<h1
						id='season-title'
						className='m-0 text-3xl font-normal leading-tight text-aw-text'
					>
						Новые аниме
					</h1>
				</div>
				<div className='group relative'>
					<button
						type='button'
						className='pointer-events-none absolute left-3 top-28 z-3 inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-0 bg-[rgba(36,37,38,0.92)] text-aw-text opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-[rgba(49,50,51,0.98)]'
						aria-label='Прокрутить сезон влево'
						onClick={() => onClickScrollSeason('left')}
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
							anime.map(anime => {
								const title = anime.title_ru || anime.title_en

								return (
									<Link
										key={anime.id}
										to={`/anime/${createAnimeSlug(anime.id, anime.title_en || title)}`}
										aria-label={title}
										className='relative grid min-w-0 no-underline'
									>
										<span className='absolute left-0 top-2 z-1 min-w-10.5 rounded bg-[#2fc244] px-2 py-1.5 text-center text-[15px] font-bold leading-none text-white'>
											{formatAnimeRating(anime.rating)}
										</span>
										<img
											className='h-62.5 w-full rounded-md bg-aw-surface object-cover aspect-2/3'
											src={anime.poster_url}
											alt={`${title} постер`}
											loading='lazy'
										/>
										<small className='mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-aw-text'>
											{anime.title_en}
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
						className='pointer-events-none absolute right-3 top-28 z-3 inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-0 bg-[rgba(36,37,38,0.92)] text-aw-text opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-[rgba(49,50,51,0.98)]'
						aria-label='Прокрутить сезон вправо'
						onClick={() => onClickScrollSeason('right')}
					>
						<ChevronRight size={28} aria-hidden='true' />
					</button>
				</div>
			</section>

			<article className='max-w-322.5 text-aw-text'>
				<section className='mt-5.5'>
					<h1 className='mb-3 mt-0 text-[38px] font-normal leading-tight text-aw-text'>
						{HOME_INTRO_TITLE}
					</h1>
					{HOME_INTRO_PARAGRAPHS.map(paragraph => (
						<p
							key={paragraph}
							className='mb-4 text-base leading-[1.55] text-[#f1f4f7]'
						>
							{paragraph}
						</p>
					))}
				</section>

				<section className='mt-5.5'>
					<h2 className='mb-3 mt-0 text-2xl font-normal leading-tight text-aw-text'>
						Наши преимущества
					</h2>
					<p className='mb-4 text-base leading-[1.55] text-[#f1f4f7]'>
						Мы подготовили для Вас следующие бонусы:
					</p>
					<ul className='m-0 grid gap-2.5 pl-8 marker:text-aw-text'>
						{HOME_ADVANTAGES.map(advantage => (
							<li
								key={advantage}
								className='text-base leading-[1.55] text-[#f1f4f7]'
							>
								{advantage}
							</li>
						))}
					</ul>
				</section>

				<section className='mt-5.5'>
					<h2 className='mb-3 mt-0 text-2xl font-normal leading-tight text-aw-text'>
						{HOME_FREE_TITLE}
					</h2>
					{HOME_FREE_PARAGRAPHS.map(paragraph => (
						<p
							key={paragraph}
							className='mb-4 text-base leading-[1.55] text-[#f1f4f7]'
						>
							{paragraph}
						</p>
					))}
				</section>
			</article>
		</main>
	)
}
