import type { AnimePlayerEpisode } from '@/types/animePage'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type AnimePlayerEpisodesProps = {
	episodes: AnimePlayerEpisode[]
	activeEpisode?: number
	onEpisodeChange?: (episodeNumber: number) => void
}

export function AnimePlayerEpisodes({
	episodes,
	activeEpisode,
	onEpisodeChange,
}: AnimePlayerEpisodesProps) {
	const activeIndex = episodes.findIndex(ep =>
		activeEpisode !== undefined ? ep.number === activeEpisode : ep.isActive,
	)

	const handlePrev = () => {
		const prev = episodes[activeIndex - 1]
		if (activeIndex > 0 && prev) {
			onEpisodeChange?.(prev.number)
		}
	}

	const handleNext = () => {
		const next = episodes[activeIndex + 1]
		if (activeIndex < episodes.length - 1 && next) {
			onEpisodeChange?.(next.number)
		}
	}

	const isPrevDisabled = activeIndex <= 0
	const isNextDisabled = activeIndex >= episodes.length - 1

	return (
		<div className='mt-2 flex items-center gap-4 overflow-x-auto pb-1 text-xs text-aw-text scrollbar-none [&::-webkit-scrollbar]:hidden'>
			<span className='shrink-0 border-b border-dashed border-aw-subtle text-aw-subtle'>
				Серия №
			</span>
			{episodes.map(episode => {
				const isActive =
					activeEpisode !== undefined
						? episode.number === activeEpisode
						: episode.isActive

				return (
					<button
						key={episode.number}
						type='button'
						onClick={() => onEpisodeChange?.(episode.number)}
						className={`h-8 min-w-18 rounded-md px-4 transition ${
							isActive
								? 'bg-[#595b5d] text-aw-accent'
								: 'bg-transparent text-aw-text hover:bg-aw-elevated'
						}`}
					>
						{episode.number}
					</button>
				)
			})}
			<button
				type='button'
				onClick={handlePrev}
				disabled={isPrevDisabled}
				className='ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center text-aw-subtle transition hover:text-aw-text disabled:cursor-not-allowed disabled:opacity-30'
				title='Предыдущая серия'
			>
				<ChevronLeft size={22} aria-hidden='true' />
			</button>
			<button
				type='button'
				onClick={handleNext}
				disabled={isNextDisabled}
				className='inline-flex h-8 w-8 shrink-0 items-center justify-center text-aw-subtle transition hover:text-aw-text disabled:cursor-not-allowed disabled:opacity-30'
				title='Следующая серия'
			>
				<ChevronRight size={22} aria-hidden='true' />
			</button>
		</div>
	)
}
