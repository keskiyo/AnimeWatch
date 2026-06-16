import { getAnime, getRelated } from '@/api/animeApi'
import { getKodikPlayer } from '@/api/playerApi'
import { AnimePageContent } from '@/features/animepage/components/AnimePageContent'
import { EmptyAnimePage } from '@/features/animepage/components/EmptyAnimePage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import type { AnimePageData } from '@/types/animePage'
import { createAnimePageData } from '@/utils/animepage/animePageData'
import { createAnimeSlug, parseAnimeSlugId } from '@/utils/anime/animeSlug'
import { setPageMeta } from '@/utils/pageMeta'
import { animeJsonLd } from '@/utils/animepage/structuredData'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type AnimePageState =
	| { status: 'loading' }
	| { status: 'not-found' }
	| { status: 'ready'; data: AnimePageData }

export function AnimePage() {
	const { animeSlug } = useParams()
	const navigate = useNavigate()
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

			const anime = await getAnime(id)
			if (isCancelled) return

			if (!anime) {
				setState({ status: 'not-found' })
				return
			}

			// One canonical URL per title: redirect decorative/wrong slugs to
			// `{id}-{slug}` so crawlers don't see duplicate paths.
			const title = anime.title_ru || anime.title_en || 'Аниме'
			// Slug prefers the romaji/English title (matches catalog cards)
			const slug = createAnimeSlug(id, anime.title_en || anime.title_ru)
			if (animeSlug !== slug) {
				navigate(`/anime/${slug}`, { replace: true })
			}
			const canonical = `/anime/${slug}`

			setPageMeta({
				title: `${title} — AnimeWatch`,
				description: anime.description,
				canonical,
				ogType: 'video.tv_show',
				image: anime.poster_url,
				jsonLd: animeJsonLd(anime, canonical),
			})
			setState({
				status: 'ready',
				data: createAnimePageData(anime),
			})

			const [player, related] = await Promise.all([
				getKodikPlayer(id, 1),
				getRelated(id),
			])

			if (!isCancelled) {
				setState({
					status: 'ready',
					data: createAnimePageData(anime, player, related),
				})
			}
		}

		void loadAnimePage()

		return () => {
			isCancelled = true
		}
	}, [id])

	if (state.status === 'loading') {
		return (
			<main>
				<EmptyAnimePage />
			</main>
		)
	}

	if (state.status === 'not-found') {
		return (
			<NotFoundPage
				title='Аниме не найдено'
				message='Такого тайтла нет в каталоге или он ещё не загружен.'
			/>
		)
	}

	return (
		<main>
			<AnimePageContent data={state.data} />
		</main>
	)
}
