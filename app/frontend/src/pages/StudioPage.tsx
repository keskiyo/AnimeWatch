import { getStudioAnime } from '@/api/animeApi'
import { AnimeCard } from '@/features/catalog/components/AnimeCard'
import type { Anime } from '@/types/anime'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

type SortKey = 'year' | 'rating' | 'title'

const SORT_LABELS: Record<SortKey, string> = {
	year: 'году',
	rating: 'рейтингу',
	title: 'названию',
}

const GRID_CLASSES =
	'grid grid-cols-4 gap-x-5 gap-y-7 max-[900px]:grid-cols-3 max-[640px]:grid-cols-2 max-[420px]:grid-cols-1'

const PAGE_SIZE = 24

type LoadState = 'idle' | 'loading' | 'done' | 'error'

export function StudioPage() {
	const { studioName } = useParams()
	const studio = decodeURIComponent(studioName ?? '')

	const [anime, setAnime] = useState<Anime[]>([])
	const [total, setTotal] = useState(0)
	const [loadState, setLoadState] = useState<LoadState>('idle')
	const [sort, setSort] = useState<SortKey>('year')
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
	const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

	// Fetch all studio anime on studio name change
	useEffect(() => {
		if (!studio) return
		let cancelled = false

		setLoadState('loading')
		setAnime([])
		setTotal(0)
		setDisplayCount(PAGE_SIZE)

		getStudioAnime(studio).then(result => {
			if (cancelled) return
			setAnime(result.data)
			setTotal(result.total ?? result.data.length)
			setLoadState('done')
		}).catch(() => {
			if (!cancelled) setLoadState('error')
		})

		return () => { cancelled = true }
	}, [studio])

	// Meta tags
	useEffect(() => {
		document.title = `Аниме студии ${studio} — AnimeWatch`
	}, [studio])

	// Sort
	const sorted = useMemo(() => {
		const copy = [...anime]
		copy.sort((a, b) => {
			let cmp = 0
			if (sort === 'rating') cmp = (b.rating ?? 0) - (a.rating ?? 0)
			else if (sort === 'title') cmp = (a.title_ru || a.title_en).localeCompare(b.title_ru || b.title_en)
			else cmp = (b.year ?? 0) - (a.year ?? 0)
			return sortDir === 'desc' ? cmp : -cmp
		})
		return copy
	}, [anime, sort, sortDir])

	const displayed = sorted.slice(0, displayCount)
	const hasMore = displayCount < sorted.length

	function cycleSort(key: SortKey) {
		if (sort === key) {
			setSortDir(d => d === 'desc' ? 'asc' : 'desc')
		} else {
			setSort(key)
			setSortDir('desc')
		}
	}

	return (
		<main className='mx-auto max-w-345 px-4 py-6.5 pb-10'>
			<section className='min-w-0 rounded-lg bg-aw-surface px-3.75 pb-7 pt-4'>
				{/* Breadcrumb */}
				<div className='mb-1 flex flex-wrap items-center gap-2'>
					<Link to='/anime' className='text-sm text-aw-accent no-underline hover:underline'>
						Каталог
					</Link>
					<span className='text-sm text-aw-subtle'>/</span>
					<span className='text-sm text-aw-subtle'>Студия</span>
				</div>

				{/* Title */}
				<h1 className='mb-1 text-3xl font-normal leading-tight text-aw-text'>
					{studio || 'Студия'}
				</h1>
				<p className='mb-1 text-sm text-aw-subtle'>
					В этом разделе собраны аниме, созданные студией {studio}
				</p>
				{loadState === 'done' && (
					<p className='mb-4 text-xs text-aw-subtle'>
						Найдено: {total}
					</p>
				)}

				<hr className='mb-5 border-0 border-t border-aw-border' />

				{/* Sort bar */}
				{loadState === 'done' && anime.length > 0 && (
					<div className='mb-5 flex flex-wrap items-center gap-2 text-sm text-aw-subtle'>
						<span>Сортировать по:</span>
						{(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
							<button
								key={key}
								type='button'
								onClick={() => cycleSort(key)}
								className={`rounded px-2 py-0.5 transition-colors ${
									sort === key
										? 'text-aw-accent underline underline-offset-2'
										: 'hover:text-aw-text'
								}`}
							>
								{SORT_LABELS[key]}
								{sort === key && (
									<span className='ml-0.5 text-xs'>
										{sortDir === 'desc' ? '↓' : '↑'}
									</span>
								)}
							</button>
						))}
					</div>
				)}

				{/* Content */}
				{loadState === 'loading' ? (
					<div className='flex flex-col items-center gap-3 py-14 text-aw-subtle'>
						<div className='h-8 w-8 animate-spin rounded-full border-2 border-aw-border border-t-aw-accent' />
						<span className='text-sm'>Загрузка аниме студии…</span>
					</div>
				) : loadState === 'error' ? (
					<div className='py-10 text-center text-sm text-aw-subtle'>
						Не удалось загрузить данные. Попробуйте позже.
					</div>
				) : displayed.length === 0 ? (
					<div className='py-10 text-center text-sm text-aw-subtle'>
						Аниме этой студии не найдены.
					</div>
				) : (
					<>
						<div className={GRID_CLASSES}>
							{displayed.map(item => (
								<AnimeCard key={item.id} anime={item} variant='poster' />
							))}
						</div>

						{hasMore && (
							<div className='mt-8 flex items-center justify-center gap-3'>
								<button
									type='button'
									onClick={() => setDisplayCount(c => c + PAGE_SIZE)}
									className='cursor-pointer rounded-md border border-aw-border bg-aw-elevated px-6 py-2.5 text-sm text-aw-text transition-colors hover:bg-aw-surface'
								>
									Показать ещё ({sorted.length - displayCount})
								</button>
							</div>
						)}
					</>
				)}
			</section>
		</main>
	)
}
