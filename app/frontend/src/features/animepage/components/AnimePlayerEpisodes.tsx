import type { AnimePlayerEpisode } from '@/types/animePage'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type AnimePlayerEpisodesProps = {
	episodes: AnimePlayerEpisode[]
}

export function AnimePlayerEpisodes({ episodes }: AnimePlayerEpisodesProps) {
	return (
		<div className='mt-2 flex items-center gap-4 overflow-x-auto pb-1 text-xs text-aw-text scrollbar-none [&::-webkit-scrollbar]:hidden'>
			<span className='shrink-0 border-b border-dashed border-aw-subtle text-aw-subtle'>
				Серия №
			</span>
			{episodes.map(episode => (
				<button
					key={episode.number}
					type='button'
					className={`h-8 min-w-18 rounded-md px-4 transition ${
						episode.isActive
							? 'bg-[#595b5d] text-aw-accent'
							: 'bg-transparent text-aw-text hover:bg-aw-elevated'
					}`}
				>
					{episode.number}
				</button>
			))}
			<button
				type='button'
				className='ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center text-aw-subtle hover:text-aw-text cursor-pointer'
				aria-label='Предыдущая серия'
			>
				<ChevronLeft size={22} aria-hidden='true' />
			</button>
			<button
				type='button'
				className='inline-flex h-8 w-8 shrink-0 items-center justify-center text-aw-subtle hover:text-aw-text cursor-pointer'
				aria-label='Следующая серия'
			>
				<ChevronRight size={22} aria-hidden='true' />
			</button>
		</div>
	)
}
