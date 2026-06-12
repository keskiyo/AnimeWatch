export function CommentsSkeleton() {
	return (
		<div className='grid animate-pulse gap-8' aria-hidden='true'>
			{Array.from({ length: 3 }, (_, i) => (
				<div key={i} className='flex gap-4'>
					<span className='h-14 w-14 shrink-0 rounded-full bg-aw-elevated' />
					<span className='grid flex-1 content-start gap-2'>
						<span className='h-4 w-40 rounded bg-aw-elevated' />
						<span className='h-4 w-full rounded bg-aw-elevated' />
						<span className='h-4 w-2/3 rounded bg-aw-elevated' />
					</span>
				</div>
			))}
		</div>
	)
}
