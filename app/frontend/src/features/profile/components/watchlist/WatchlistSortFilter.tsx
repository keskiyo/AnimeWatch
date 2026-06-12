import { WatchlistFilterDropdown } from './WatchlistFilterDropdown'
import type { WatchlistSortFilterProps } from '@/types/watchlist'
import { WATCHLIST_SORT_OPTIONS } from '@/utils/watchlistData'
import { Check } from 'lucide-react'

export function WatchlistSortFilter({ value, onChange }: WatchlistSortFilterProps) {
	const selected = WATCHLIST_SORT_OPTIONS.find(option => option.value === value)

	return (
		<WatchlistFilterDropdown
			label='Дата добавления'
			value={selected ? `Дата добавления: ${selected.label}` : undefined}
			onClear={() => onChange('date-desc')}
		>
			<div className='grid'>
				{WATCHLIST_SORT_OPTIONS.map(option => (
					<button
						key={option.value}
						type='button'
						onClick={() => onChange(option.value)}
						className='grid min-h-8 cursor-pointer grid-cols-[18px_1fr] items-center gap-2 border-b border-aw-border bg-transparent px-1 text-left text-sm text-aw-text transition last:border-b-0 hover:text-aw-accent'
					>
						<span>{option.value === value && <Check size={14} />}</span>
						{option.label}
					</button>
				))}
			</div>
		</WatchlistFilterDropdown>
	)
}
