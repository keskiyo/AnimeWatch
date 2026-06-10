import { getHomeSeasonAnime } from '@/api/scheduleApi'
import { HomeSeasonRail } from '@/features/home/components/HomeSeasonRail'
import type { Anime } from '@/types/anime'
import {
	HOME_ADVANTAGES,
	HOME_FREE_PARAGRAPHS,
	HOME_FREE_TITLE,
	HOME_INTRO_PARAGRAPHS,
	HOME_INTRO_TITLE,
} from '@/utils/catalogTexts'
import { setPageMeta } from '@/utils/pageMeta'
import { useEffect, useState } from 'react'

type ScheduleItem = {
	anime: Anime
	episode: number
	time: string
	studio?: string
}

type ScheduleResponse = Record<string, ScheduleItem[]>

export function HomePage() {
	const [anime, setAnime] = useState<Anime[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		setPageMeta(
			'AnimeWatch — смотреть аниме онлайн бесплатно',
			'Смотрите аниме онлайн бесплатно без регистрации. Большой каталог: сериалы, фильмы, OVA. Удобный поиск по жанрам и рейтингу.',
		)
	}, [])

	useEffect(() => {
		let isCancelled = false

		async function loadHomeAnime() {
			try {
				setIsLoading(true)

				const result = await getHomeSeasonAnime(15)

				console.log('HOME anime:', result.slice(0, 5))

				if (!isCancelled) {
					setAnime(result)
				}
			} catch (error) {
				console.error('Failed to load home anime:', error)

				if (!isCancelled) {
					setAnime([])
				}
			} finally {
				if (!isCancelled) {
					setIsLoading(false)
				}
			}
		}

		void loadHomeAnime()

		return () => {
			isCancelled = true
		}
	}, [])

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
				<HomeSeasonRail anime={anime} isLoading={isLoading} />
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
