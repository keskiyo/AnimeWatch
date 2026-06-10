import { getStudioAnime } from '@/api/catalogApi'
import {
	AnimeGridSection,
	type GridLoadState,
} from '@/components/anime/AnimeGridSection'
import { StudioSortBar } from '@/features/studio/components/StudioSortBar'
import type { Anime } from '@/types/anime'
import type { StudioSortDirection, StudioSortKey } from '@/types/studio'
import { setPageMeta } from '@/utils/pageMeta'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const PAGE_SIZE = 24

export function StudioPage() {
	const { studioName } = useParams()
	const studio = decodeURIComponent(studioName ?? '')

	const [anime, setAnime] = useState<Anime[]>([])
	const [total, setTotal] = useState(0)
	const [loadState, setLoadState] = useState<GridLoadState>('idle')
	const [sort, setSort] = useState<StudioSortKey>('year')
	const [sortDir, setSortDir] = useState<StudioSortDirection>('desc')
	const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

	// Fetch all studio anime on studio name change
	useEffect(() => {
		if (!studio) return
		let cancelled = false

		setLoadState('loading')
		setAnime([])
		setTotal(0)
		setDisplayCount(PAGE_SIZE)

		getStudioAnime(studio)
			.then(result => {
				if (cancelled) return
				setAnime(result.data)
				setTotal(result.total ?? result.data.length)
				setLoadState('done')
			})
			.catch(() => {
				if (!cancelled) setLoadState('error')
			})

		return () => {
			cancelled = true
		}
	}, [studio])

	useEffect(() => {
		setPageMeta(`Аниме студии ${studio} — AnimeWatch`)
	}, [studio])

	const sorted = useMemo(() => {
		const copy = [...anime]
		copy.sort((a, b) => {
			let cmp = 0
			if (sort === 'rating') cmp = (b.rating ?? 0) - (a.rating ?? 0)
			else if (sort === 'title')
				cmp = (a.title_ru || a.title_en).localeCompare(
					b.title_ru || b.title_en,
				)
			else cmp = (b.year ?? 0) - (a.year ?? 0)
			return sortDir === 'desc' ? cmp : -cmp
		})
		return copy
	}, [anime, sort, sortDir])

	function cycleSort(key: StudioSortKey) {
		if (sort === key) {
			setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))
		} else {
			setSort(key)
			setSortDir('desc')
		}
	}

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
				<p className='mb-1 text-sm text-aw-subtle'>
					В этом разделе собраны аниме, созданные студией {studio}
				</p>
				{loadState === 'done' && (
					<p className='mb-4 text-xs text-aw-subtle'>
						Найдено: {total}
					</p>
				)}

				<hr className='mb-5 border-0 border-t border-aw-border' />

				{loadState === 'done' && anime.length > 0 && (
					<StudioSortBar
						sort={sort}
						direction={sortDir}
						onChange={cycleSort}
					/>
				)}

				<AnimeGridSection
					loadState={loadState}
					anime={sorted}
					displayCount={displayCount}
					onShowMore={() => setDisplayCount(c => c + PAGE_SIZE)}
					loadingText='Загрузка аниме студии…'
					emptyText='Аниме этой студии не найдены.'
				/>
			</section>
		</main>
	)
}
