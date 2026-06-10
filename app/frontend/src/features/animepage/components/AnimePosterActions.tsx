import { Lightbox } from '@/features/animepage/components/Lightbox'
import type { Anime, KodikPlayer } from '@/types/anime'
import { formatWatchCounter } from '@/utils/animePageFormatters'
import { proxyImage } from '@/utils/imageProxy'
import { Play } from 'lucide-react'
import { useState } from 'react'

type AnimePosterActionsProps = {
	anime: Anime
	player?: KodikPlayer
}

export function AnimePosterActions({ anime, player }: AnimePosterActionsProps) {
	const [lightboxOpen, setLightboxOpen] = useState(false)
	const posterSrc = proxyImage(anime.poster_url)
	const watchCounter = formatWatchCounter(anime, player)

	return (
		<div className='w-62.5 shrink-0 max-[760px]:w-full'>
			<div className='relative flex aspect-2/3 w-full items-end justify-center overflow-hidden rounded-md bg-aw-elevated'>
				{anime.poster_url ? (
					<img
						className='h-full w-full cursor-zoom-in object-cover transition-opacity hover:opacity-90'
						src={posterSrc}
						alt={`${anime.title_en} poster`}
						onClick={() => setLightboxOpen(true)}
					/>
				) : (
					<span className='relative px-5 pb-8 text-center text-[clamp(34px,6vw,56px)] font-black leading-none text-white/90 [text-shadow:0_8px_24px_rgba(0,0,0,0.5)]'>
						{anime.title_en.slice(0, 2).toUpperCase()}
					</span>
				)}
			</div>

			{lightboxOpen && posterSrc && (
				<Lightbox
					src={posterSrc}
					alt={`${anime.title_en} poster`}
					onClose={() => setLightboxOpen(false)}
				/>
			)}

			<div className='mt-2 grid gap-2'>
				<button
					type='button'
					className='grid h-9 cursor-pointer grid-cols-[1fr_auto] items-center rounded-md bg-[#f31b18] px-3 text-sm text-white transition hover:bg-[#ff302c]'
				>
					<span className='inline-flex items-center gap-2'>
						<Play
							size={16}
							fill='currentColor'
							aria-hidden='true'
						/>
						Смотреть онлайн
					</span>
					{watchCounter && <span>{watchCounter}</span>}
				</button>
			</div>
		</div>
	)
}
