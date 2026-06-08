import type { AnimePlayerTrack } from '@/types/animePage'

type AnimePlayerTracksProps = {
	tracks: AnimePlayerTrack[]
}

export function AnimePlayerTracks({ tracks }: AnimePlayerTracksProps) {
	return (
		<aside className='bg-aw-bg px-3 py-3'>
			<div className='mb-3 flex gap-7 border-b border-aw-border text-sm'>
				<button
					type='button'
					className='border-b border-white pb-2 text-aw-text cursor-pointer'
				>
					Озвучка
				</button>
				<button
					type='button'
					className='pb-2 text-aw-accent cursor-pointer'
				>
					Плеер
				</button>
			</div>
			<div className='grid gap-1.5'>
				{tracks.map(track => (
					<button
						key={track.id}
						type='button'
						disabled={track.isMuted}
						className={`rounded px-3 py-2 text-left text-sm ${
							track.isMuted
								? 'cursor-default text-aw-subtle'
								: track.isActive
									? 'bg-[#4b4d4f] text-aw-accent'
									: 'text-aw-text hover:bg-aw-surface'
						}`}
					>
						{track.label}
					</button>
				))}
			</div>
		</aside>
	)
}
