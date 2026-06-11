import { getAnime, getRelated } from '@/api/animeApi'
import { getKodikPlayer } from '@/api/playerApi'
import { AnimePageContent } from '@/features/animepage/components/AnimePageContent'
import { EmptyAnimePage } from '@/features/animepage/components/EmptyAnimePage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import type { AnimePageData } from '@/types/animePage'
import { createAnimePageData } from '@/utils/animePageData'
import { parseAnimeSlugId } from '@/utils/animeSlug'
import { setPageMeta } from '@/utils/pageMeta'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

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
			setPageMeta('AnimeWatch')
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

			setPageMeta(
				`${anime.title_ru || anime.title_en || 'Аниме'} — AnimeWatch`,
				anime.description,
			)
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
