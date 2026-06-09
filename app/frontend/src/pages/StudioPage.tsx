import { AnimeCard } from '@/features/catalog/components/AnimeCard'
import { useAnimeCache } from '@/features/catalog/hooks/useAnimeCache'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const GRID_CLASSES =
	'grid grid-cols-4 gap-x-5 gap-y-7 max-[900px]:grid-cols-3 max-[640px]:grid-cols-2 max-[420px]:grid-cols-1'

const PAGE_SIZE = 24

export function StudioPage() {
	const { studioName } = useParams()
	const studio = decodeURIComponent(studioName ?? '')
	const { anime, isComplete, isLoading, total } = useAnimeCache()
	const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

	const results = useMemo(() => {
		const filtered = anime.filter(item => item.studio === studio)
		return [...filtered].sort((a, b) => {
			const cmp = b.rating - a.rating
			return cmp !== 0 ? cmp : b.year - a.year
		})
	}, [anime, studio])

	const displayed = results.slice(0, displayCount)
	const hasMore = displayCount < results.length

	useEffect(() => {
		document.title = `Аниме студии ${studio} — AnimeWatch`
		setMetaDescription(
			`Все аниме студии ${studio}. Полный список тайтлов, отсортированный по рейтингу.`,
		)
	}, [studio])

	useEffect(() => {
		setDisplayCount(PAGE_SIZE)
	}, [studio])

	const isInitialLoading = anime.length === 0 && isLoading

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
					<span className='text-sm text-aw-subtle'>Студия</span>
				</div>
				<h1 className='mb-1 text-3xl font-normal leading-tight text-aw-text'>
					{studio || 'Студия'}
				</h1>
				<p className='mb-4 text-sm text-aw-subtle'>
					Аниме студии «{studio}»{isComplete && `: ${results.length}`}
				</p>
				<hr className='mb-7 border-0 border-t border-aw-border' />
				{!isComplete && anime.length > 0 && (
					<div className='pb-3 text-xs text-aw-subtle'>
						Загружено {anime.length}
						{total > 0 ? ` / ${total}` : ''} аниме...
					</div>
				)}

				{isInitialLoading ? (
					<div className='py-10 text-center text-aw-subtle'>
						Загрузка...
					</div>
				) : displayed.length === 0 ? (
					<div className='py-10 text-center text-aw-subtle'>
						{isComplete
							? 'Аниме этой студии не найдены.'
							: 'Идёт загрузка каталога...'}
					</div>
				) : (
					<>
						<div className={GRID_CLASSES}>
							{displayed.map(item => (
								<AnimeCard
									key={item.id}
									anime={item}
									variant='poster'
								/>
							))}
						</div>
						{hasMore && (
							<div className='mt-8 flex justify-center'>
								<button
									type='button'
									onClick={() =>
										setDisplayCount(c => c + PAGE_SIZE)
									}
									className='cursor-pointer rounded-md border border-aw-border bg-aw-elevated px-6 py-2.5 text-sm text-aw-text transition-colors hover:bg-aw-surface'
								>
									Показать ещё
								</button>
							</div>
						)}
					</>
				)}
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
