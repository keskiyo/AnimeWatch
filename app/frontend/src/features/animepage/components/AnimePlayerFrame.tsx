import type { KodikPlayer } from '@/types/anime'
import { isAllowedPlayerUrl } from '@/utils/player'
import { Play } from 'lucide-react'

type AnimePlayerFrameProps = {
	title: string
	background: string
	player?: KodikPlayer
}

export function AnimePlayerFrame({
	title,
	background,
	player,
}: AnimePlayerFrameProps) {
	const canRenderPlayer = player?.available && isAllowedPlayerUrl(player.link)

	return (
		<div
			className='relative flex aspect-video min-h-75 items-center justify-center overflow-hidden bg-aw-elevated'
			style={{ background }}
		>
			{canRenderPlayer ? (
				<iframe
					className='h-full w-full border-0'
					src={player.link}
					title={`${title} Kodik player`}
					allow='autoplay; fullscreen; picture-in-picture'
					allowFullScreen
					referrerPolicy='no-referrer-when-downgrade'
				/>
			) : (
				<PlayerPlaceholder player={player} />
			)}
		</div>
	)
}

function PlayerPlaceholder({ player }: { player?: KodikPlayer }) {
	return (
		<>
			<div className='absolute inset-0 bg-[radial-gradient(circle_at_35%_22%,rgba(255,255,255,0.24),transparent_26%),linear-gradient(90deg,rgba(0,0,0,0.52),rgba(0,0,0,0.2)),linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.55))]' />
			<div className='relative grid justify-items-center gap-3 px-6 text-center text-aw-text'>
				<span className='flex h-24 w-24 items-center justify-center rounded-full border border-white/40 bg-black/25 text-white'>
					<Play
						size={48}
						fill='currentColor'
						className='translate-x-1'
						aria-hidden='true'
					/>
				</span>
				<span className='max-w-120 text-sm text-aw-subtle'>
					{player?.available === false
						? player.message
						: 'Kodik player is loading'}
				</span>
			</div>
		</>
	)
}
