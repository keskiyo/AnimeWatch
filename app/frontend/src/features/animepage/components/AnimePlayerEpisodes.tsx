import type { AnimePlayerEpisode } from '@/types/animePage'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type AnimePlayerEpisodesProps = {
	episodes: AnimePlayerEpisode[]
	activeEpisode?: number
	availableEpisodesCount?: number | null
	onEpisodeChange?: (episodeNumber: number) => void
}

const VISIBLE_EPISODES = 8

export function AnimePlayerEpisodes({
	episodes,
	activeEpisode,
	availableEpisodesCount,
	onEpisodeChange,
}: AnimePlayerEpisodesProps) {
	const displayEpisodes = useMemo(() => {
		if (availableEpisodesCount == null) {
			return episodes
		}

		if (availableEpisodesCount <= 0) {
			return []
		}

		return episodes.slice(0, availableEpisodesCount)
	}, [episodes, availableEpisodesCount])

	const activeIndex = displayEpisodes.findIndex(ep =>
		activeEpisode !== undefined ? ep.number === activeEpisode : ep.isActive,
	)

	const normalizedActiveIndex = activeIndex >= 0 ? activeIndex : 0

	const pages = useMemo(() => {
		const result: AnimePlayerEpisode[][] = []

		for (let i = 0; i < displayEpisodes.length; i += VISIBLE_EPISODES) {
			result.push(displayEpisodes.slice(i, i + VISIBLE_EPISODES))
		}

		return result
	}, [displayEpisodes])

	const [page, setPage] = useState(0)

	useEffect(() => {
		if (displayEpisodes.length === 0) {
			setPage(0)
			return
		}

		const activePage = Math.floor(normalizedActiveIndex / VISIBLE_EPISODES)

		setPage(prevPage => {
			const activeIsVisible =
				normalizedActiveIndex >= prevPage * VISIBLE_EPISODES &&
				normalizedActiveIndex < (prevPage + 1) * VISIBLE_EPISODES

			if (activeIsVisible) return prevPage

			return activePage
		})
	}, [normalizedActiveIndex, displayEpisodes.length])

	const isPrevDisabled = page <= 0
	const isNextDisabled = page >= pages.length - 1

	const handlePrev = () => {
		setPage(prev => Math.max(0, prev - 1))
	}

	const handleNext = () => {
		setPage(prev => Math.min(pages.length - 1, prev + 1))
	}

	if (displayEpisodes.length === 0) {
		return (
			<div className='mt-3 flex w-full items-center gap-5 pb-1 text-sm text-aw-subtle'>
				<span className='shrink-0 border-b border-dashed border-aw-subtle'>
					Серия №
				</span>
				<span>Серии пока недоступны</span>
			</div>
		)
	}

	return (
		<div className='mt-3 flex w-full items-center gap-5 overflow-hidden pb-1 text-sm text-aw-text'>
			<span className='shrink-0 border-b border-dashed border-aw-subtle text-aw-subtle'>
				Серия №
			</span>

			<div className='min-w-0 flex-1 overflow-hidden'>
				<div
					className='flex transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none'
					style={{
						transform: `translateX(-${page * 100}%)`,
					}}
				>
					{pages.map((pageEpisodes, pageIndex) => (
						<div
							key={pageIndex}
							className='grid w-full shrink-0 gap-5'
							style={{
								gridTemplateColumns: `repeat(${VISIBLE_EPISODES}, minmax(0, 1fr))`,
							}}
						>
							{pageEpisodes.map(episode => {
								const isActive =
									activeEpisode !== undefined
										? episode.number === activeEpisode
										: episode.isActive

								const episodeTitle =
									episode.title ?? `Серия ${episode.number}`

								return (
									<button
										key={episode.number}
										type='button'
										title={episodeTitle}
										aria-label={episodeTitle}
										onClick={() =>
											onEpisodeChange?.(episode.number)
										}
										className={[
											'h-12 w-full cursor-pointer rounded-2xl px-6 text-base transition-colors duration-200',
											isActive
												? 'bg-[#4f5052] text-aw-accent'
												: 'bg-transparent text-aw-text hover:bg-aw-elevated',
										].join(' ')}
									>
										{episode.number}
									</button>
								)
							})}
						</div>
					))}
				</div>
			</div>

			{pages.length > 1 && (
				<div className='ml-auto flex shrink-0 items-center border-l border-aw-border pl-4'>
					<button
						type='button'
						onClick={handlePrev}
						disabled={isPrevDisabled}
						className='inline-flex h-10 w-10 cursor-pointer items-center justify-center text-aw-subtle transition-colors hover:text-aw-text disabled:cursor-not-allowed disabled:opacity-30'
						title='Предыдущие серии'
					>
						<ChevronLeft size={30} aria-hidden='true' />
					</button>

					<button
						type='button'
						onClick={handleNext}
						disabled={isNextDisabled}
						className='inline-flex h-10 w-10 cursor-pointer items-center justify-center text-aw-subtle transition-colors hover:text-aw-text disabled:cursor-not-allowed disabled:opacity-30'
						title='Следующие серии'
					>
						<ChevronRight size={30} aria-hidden='true' />
					</button>
				</div>
			)}
		</div>
	)
}
