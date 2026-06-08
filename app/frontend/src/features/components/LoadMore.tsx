import { ChevronDown } from 'lucide-react'

interface LoadMoreProps {
	onClick: () => void
	isLoading?: boolean
	hasMore?: boolean
	isAutoLoadEnabled?: boolean
}

export function LoadMore({
	onClick,
	isLoading = false,
	hasMore = true,
	isAutoLoadEnabled = false,
}: LoadMoreProps) {
	if (!hasMore) return null

	return (
		<div className='mt-7.75'>
			<button
				type='button'
				onClick={onClick}
				disabled={isLoading}
				className='group flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-aw-elevated px-6 py-4 text-[15px] font-medium text-aw-text transition-all hover:bg-aw-elevated/80 active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60'
				aria-busy={isLoading}
			>
				{isLoading ? (
					<>
						<div className='h-5 w-5 animate-spin rounded-full border-2 border-aw-text/30 border-t-aw-text' />
						<span>Загрузка...</span>
					</>
				) : (
					<>
						<span>
							{isAutoLoadEnabled
								? 'Автозагрузка включена'
								: 'Загрузить ещё'}
						</span>
						<ChevronDown
							size={20}
							className='transition-transform group-hover:translate-y-0.5'
							aria-hidden='true'
						/>
					</>
				)}
			</button>
		</div>
	)
}
