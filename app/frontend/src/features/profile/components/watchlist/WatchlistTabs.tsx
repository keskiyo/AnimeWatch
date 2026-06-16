import type { WatchlistEntry, WatchlistStatus } from '@/types/anime'
import { WATCHLIST_LABELS, WATCHLIST_STATUSES } from '@/utils/watchlist/watchlistData'

type WatchlistTabsProps = {
	active: WatchlistStatus
	entries: WatchlistEntry[]
	onChange: (status: WatchlistStatus) => void
}

export function WatchlistTabs({
	active,
	entries,
	onChange,
}: WatchlistTabsProps) {
	return (
		<div className='flex gap-2 overflow-x-auto pb-1'>
			{WATCHLIST_STATUSES.map(status => {
				const count = entries.filter(item => item.status === status).length
				const selected = active === status
				return (
					<button
						key={status}
						type='button'
						onClick={() => onChange(status)}
						className={`shrink-0 cursor-pointer rounded-md border px-3 py-2 text-sm transition ${
							selected
								? 'border-aw-accent bg-aw-accent text-white'
								: 'border-aw-border bg-aw-muted text-aw-text hover:border-aw-accent'
						}`}
					>
						{WATCHLIST_LABELS[status]} ({count})
					</button>
				)
			})}
		</div>
	)
}
