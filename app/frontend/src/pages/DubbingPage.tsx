import { getDubbingAnime } from '@/api/catalogApi'
import {
	AnimeGridSection,
	type GridLoadState,
} from '@/components/anime/AnimeGridSection'
import type { Anime } from '@/types/anime'
import { setPageMeta } from '@/utils/pageMeta'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

const PAGE_SIZE = 24

export function DubbingPage() {
	const { translationId } = useParams()
	const [searchParams] = useSearchParams()
	const id = Number(translationId)
	const name = searchParams.get('name') ?? 'Студия озвучки'

	const [anime, setAnime] = useState<Anime[]>([])
	const [loadState, setLoadState] = useState<GridLoadState>('idle')
	const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

	useEffect(() => {
		if (!Number.isFinite(id) || id <= 0) {
			setLoadState('error')
			return
		}
		let cancelled = false

		setLoadState('loading')
		setAnime([])
		setDisplayCount(PAGE_SIZE)

		getDubbingAnime(id)
			.then(result => {
				if (cancelled) return
				setAnime(result.data)
				setLoadState('done')
			})
			.catch(() => {
				if (!cancelled) setLoadState('error')
			})

		return () => {
			cancelled = true
		}
	}, [id])

	useEffect(() => {
		setPageMeta(`Аниме в озвучке ${name} — AnimeWatch`)
	}, [name])

	return (
		<main className='mx-auto max-w-345 px-4 py-6.5 pb-10'>
			<section className='min-w-0 rounded-lg bg-aw-surface px-3.75 pb-7 pt-4'>
				<div className='mb-1 flex flex-wrap items-center gap-2'>
					<Link
						to='/anime'
						className='text-sm text-aw-accent no-underline hover:underline'
					>
						Каталог
					</Link>
					<span className='text-sm text-aw-subtle'>/</span>
					<span className='text-sm text-aw-subtle'>Озвучка</span>
				</div>

				<h1 className='mb-1 text-3xl font-normal leading-tight text-aw-text'>
					{name}
				</h1>
				<p className='mb-1 text-sm text-aw-subtle'>
					Аниме, доступные в озвучке {name}
				</p>
				{loadState === 'done' && (
					<p className='mb-4 text-xs text-aw-subtle'>
						Найдено: {anime.length}
					</p>
				)}

				<hr className='mb-5 border-0 border-t border-aw-border' />

				<AnimeGridSection
					loadState={loadState}
					anime={anime}
					displayCount={displayCount}
					onShowMore={() => setDisplayCount(c => c + PAGE_SIZE)}
					loadingText='Загрузка аниме…'
					emptyText='Аниме в этой озвучке не найдены.'
				/>
			</section>
		</main>
	)
}
