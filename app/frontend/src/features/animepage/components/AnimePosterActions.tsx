import type { Anime } from '@/types/anime'
import { Play } from 'lucide-react'

type AnimePosterActionsProps = {
	anime: Anime
}

export function AnimePosterActions({ anime }: AnimePosterActionsProps) {
	return (
		<div className='w-62.5 shrink-0 max-[760px]:w-full'>
			<div className='relative flex aspect-2/3 w-full items-end justify-center overflow-hidden rounded-md bg-aw-elevated'>
				{anime.poster_url ? (
					<img
						className='h-full w-full object-cover'
						src={anime.poster_url}
						alt={`${anime.title_en} poster`}
					/>
				) : (
					<span className='relative px-5 pb-8 text-center text-[clamp(34px,6vw,56px)] font-black leading-none text-white/90 [text-shadow:0_8px_24px_rgba(0,0,0,0.5)]'>
						{anime.title_en.slice(0, 2).toUpperCase()}
					</span>
				)}
			</div>
			<div className='mt-2 grid gap-2'>
				<button
					type='button'
					className='grid h-9 grid-cols-[1fr_auto] items-center rounded-md bg-[#f31b18] px-3 text-sm text-white transition hover:bg-[#ff302c]'
				>
					<span className='inline-flex items-center gap-2'>
						<Play
							size={16}
							fill='currentColor'
							aria-hidden='true'
						/>
						Смотреть онлайн
					</span>
					<span>
						{anime.episodes_aired} / {anime.episodes_total || '?'}
					</span>
				</button>
			</div>
		</div>
	)
}
