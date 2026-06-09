import { getAnime, getKodikPlayer, getRelated } from '@/api/animeApi'
import { AnimePageContent } from '@/features/animepage/components/AnimePageContent'
import type { AnimePageData } from '@/types/animePage'
import { createAnimePageData } from '@/utils/animePageData'
import { parseAnimeSlugId } from '@/utils/animeSlug'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

type AnimePageState =
	| { status: 'loading' }
	| { status: 'not-found' }
	| { status: 'ready'; data: AnimePageData }

export function AnimePage() {
	const { animeSlug } = useParams()
	const id = parseAnimeSlugId(animeSlug)
	const [state, setState] = useState<AnimePageState>({ status: 'loading' })

	useEffect(() => {
		let isCancelled = false

		async function loadAnimePage() {
			if (!id) {
				setState({ status: 'not-found' })
				return
			}

			setState({ status: 'loading' })

			const [anime, player, relatedAnime] = await Promise.all([
				getAnime(id),
				getKodikPlayer(id, 1),
				getRelated(id),
			])

			if (isCancelled) return

			setState(
				anime
					? {
							status: 'ready',
							data: createAnimePageData(anime, player, relatedAnime),
						}
					: { status: 'not-found' },
			)
		}

		void loadAnimePage()

		return () => {
			isCancelled = true
		}
	}, [id])

	useEffect(() => {
		if (state.status === 'ready') {
			const title =
				state.data.anime.title_ru || state.data.anime.title_en
			document.title = `${title} — смотреть онлайн | AnimeWatch`
			setMetaDescription(
				`Смотреть аниме «${title}» онлайн бесплатно на AnimeWatch. Все серии в хорошем качестве.`,
			)
		} else if (state.status === 'loading') {
			document.title = 'Загрузка... | AnimeWatch'
		}
	}, [state])

	if (state.status === 'loading') {
		return (
			<main className='mx-auto max-w-345 px-4 py-8'>
				<section className='rounded-lg bg-aw-surface p-6 text-aw-subtle'>
					Загрузка аниме...
				</section>
			</main>
		)
	}

	if (state.status === 'not-found') {
		return <NotFoundState />
	}

	return (
		<main>
			<AnimePageContent data={state.data} />
		</main>
	)
}

function NotFoundState() {
	return (
		<main className='mx-auto max-w-345 px-4 py-8'>
			<section className='rounded-lg bg-aw-surface p-6'>
				<h1 className='mb-3 text-3xl font-normal text-aw-text'>
					Аниме не найдено
				</h1>
				<p className='mb-5 text-aw-subtle'>
					Такого тайтла нет в текущем каталоге.
				</p>
				<Link
					to='/anime'
					className='inline-flex rounded-md bg-aw-accent px-4 py-2 text-sm text-white transition hover:bg-[#ff6d66]'
				>
					Вернуться в каталог
				</Link>
			</section>
		</main>
	)
}

function setMetaDescription(content: string) {
	let meta = document.querySelector<HTMLMetaElement>(
		'meta[name="description"]',
	)
	if (!meta) {
		meta = document.createElement('meta')
		meta.name = 'description'
		document.head.appendChild(meta)
	}
	meta.content = content
}
