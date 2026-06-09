import type { AnimeFrame } from '@/types/animePage'
import { proxyImage } from '@/utils/imageProxy'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

type AnimeFramesProps = {
	frames: AnimeFrame[]
}

export function AnimeFrames({ frames }: AnimeFramesProps) {
	const railRef = useRef<HTMLDivElement>(null)

	if (frames.length === 0) return null

	function scroll(direction: 'left' | 'right') {
		railRef.current?.scrollBy({
			behavior: 'smooth',
			left: direction === 'left' ? -480 : 480,
		})
	}

	return (
		<section className='rounded-lg bg-aw-surface px-3.5 py-4'>
			<h2 className='mb-3 text-2xl font-normal leading-tight text-aw-text'>
				Кадры
			</h2>
			<div className='group relative'>
				<button
					type='button'
					className='pointer-events-none absolute left-3 top-1/2 z-3 inline-flex h-14 w-14 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-[rgba(36,37,38,0.92)] text-aw-text opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-[rgba(49,50,51,0.98)]'
					aria-label='Прокрутить кадры влево'
					onClick={() => scroll('left')}
				>
					<ChevronLeft size={28} aria-hidden='true' />
				</button>
				<div
					ref={railRef}
					className='grid auto-cols-[calc((100%-4*0.875rem)/5)] grid-flow-col gap-3.5 overflow-x-auto scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden max-[900px]:auto-cols-[calc((100%-0.875rem)/2)] max-[520px]:auto-cols-[100%]'
				>
					{frames.map(frame => (
						<div
							key={frame.id}
							className='relative aspect-video overflow-hidden rounded-md bg-aw-elevated'
						>
							{frame.imageUrl ? (
								<img
									src={proxyImage(frame.imageUrl)}
									alt={frame.label}
									className='h-full w-full object-cover'
									loading='lazy'
								/>
							) : (
								<span
									className='absolute inset-0'
									style={{ background: frame.gradient }}
									aria-label={frame.label}
								>
									<span className='absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(255,255,255,0.3),transparent_22%),linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.18))]' />
								</span>
							)}
						</div>
					))}
				</div>
				<button
					type='button'
					className='pointer-events-none absolute right-3 top-1/2 z-3 inline-flex h-14 w-14 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-[rgba(36,37,38,0.92)] text-aw-text opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-[rgba(49,50,51,0.98)]'
					aria-label='Прокрутить кадры вправо'
					onClick={() => scroll('right')}
				>
					<ChevronRight size={28} aria-hidden='true' />
				</button>
			</div>
		</section>
	)
}
