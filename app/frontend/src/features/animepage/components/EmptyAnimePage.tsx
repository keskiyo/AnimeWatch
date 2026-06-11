/**
 * Loading skeleton for the anime page. Mirrors the AnimePageContent layout
 * (hero, frames, related, player) so the page doesn't jump when data arrives.
 */
export function EmptyAnimePage() {
	return (
		<div
			className='mx-auto grid max-w-345 animate-pulse gap-5 px-4 py-5 pb-10'
			aria-busy='true'
			aria-label='Загрузка аниме'
		>
			{/* ── Hero: rating, title, poster + info panel, description ───── */}
			<section className='rounded-lg bg-aw-surface px-4 py-5'>
				<div className='mb-3 flex items-center gap-3'>
					<Block className='h-8 w-8 rounded-full' />
					<Block className='h-5 w-14' />
				</div>
				<Block className='mb-5 h-10 w-2/3 max-w-160' />

				<div className='flex gap-6 max-[760px]:flex-col'>
					{/* Poster + watch button */}
					<div className='w-62.5 shrink-0 max-[760px]:w-full'>
						<Block className='aspect-2/3 w-full' />
						<Block className='mt-2 h-9 w-full' />
					</div>

					{/* Info rows (label + value) */}
					<div className='grid flex-1 content-start gap-3'>
						{Array.from({ length: 10 }, (_, i) => (
							<div
								key={i}
								className='grid grid-cols-[210px_minmax(0,1fr)] gap-x-12 max-[760px]:grid-cols-1 max-[760px]:gap-y-1.5'
							>
								<Block className='h-4 w-28' />
								<Block className='h-4 w-3/5' />
							</div>
						))}
					</div>
				</div>

				{/* Description paragraphs */}
				<div className='mt-8 grid gap-2.5'>
					<Block className='h-4 w-full' />
					<Block className='h-4 w-11/12' />
					<Block className='h-4 w-4/5' />
				</div>
			</section>

			{/* ── Frames rail (5 visible) ──────────────────────────────────── */}
			<section className='rounded-lg bg-aw-surface px-3.5 py-4'>
				<Block className='mb-3 h-7 w-32' />
				<div className='grid auto-cols-[calc((100%-4*0.875rem)/5)] grid-flow-col gap-3.5 overflow-hidden max-[900px]:auto-cols-[calc((100%-0.875rem)/2)] max-[520px]:auto-cols-[100%]'>
					{Array.from({ length: 5 }, (_, i) => (
						<Block key={i} className='aspect-video w-full' />
					))}
				</div>
			</section>

			{/* ── Related rail ─────────────────────────────────────────────── */}
			<section className='rounded-lg bg-aw-surface px-3.5 py-4'>
				<Block className='mb-3 h-7 w-36' />
				<div className='grid grid-cols-[repeat(auto-fill,92px)] gap-3.5'>
					{Array.from({ length: 6 }, (_, i) => (
						<div key={i} className='w-23'>
							<Block className='mb-2 aspect-3/4 w-full' />
							<Block className='h-3 w-5/6' />
						</div>
					))}
				</div>
			</section>

			{/* ── Player: frame + episodes + sidebar tabs ──────────────────── */}
			<section>
				<Block className='mb-3 h-7 w-1/2 max-w-120' />
				<div className='grid grid-cols-[minmax(0,1fr)_260px] gap-4 max-[900px]:grid-cols-1'>
					<div>
						<Block className='aspect-video min-h-75 w-full rounded-sm' />
						<div className='mt-3 flex items-center gap-5'>
							<Block className='h-4 w-16 shrink-0' />
							{Array.from({ length: 8 }, (_, i) => (
								<Block
									key={i}
									className='h-12 w-full rounded-2xl max-[640px]:nth-[n+6]:hidden'
								/>
							))}
						</div>
						<Block className='mt-4 h-4 w-52' />
					</div>

					<div>
						<div className='flex gap-4 border-b border-aw-border pb-2'>
							<Block className='h-5 w-20' />
							<Block className='h-5 w-16' />
						</div>
						<div className='mt-3 grid gap-1'>
							{Array.from({ length: 4 }, (_, i) => (
								<Block key={i} className='h-9 w-full' />
							))}
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}

function Block({ className = '' }: { className?: string }) {
	return <div className={`rounded-md bg-aw-elevated ${className}`} />
}
