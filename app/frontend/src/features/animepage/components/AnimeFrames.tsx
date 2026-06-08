import type { AnimeFrame } from '@/types/animePage'

type AnimeFramesProps = {
	frames: AnimeFrame[]
}

export function AnimeFrames({ frames }: AnimeFramesProps) {
	return (
		<section className='rounded-lg bg-aw-surface px-3.5 py-4'>
			<h2 className='mb-3 text-2xl font-normal leading-tight text-aw-text'>
				Кадры
			</h2>
			<div className='grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1'>
				{frames.map(frame => (
					<div
						key={frame.id}
						className='relative aspect-video overflow-hidden rounded-md bg-aw-elevated'
						style={{ background: frame.gradient }}
						aria-label={frame.label}
					>
						<span className='absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(255,255,255,0.3),transparent_22%),linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.18))]' />
					</div>
				))}
			</div>
		</section>
	)
}
