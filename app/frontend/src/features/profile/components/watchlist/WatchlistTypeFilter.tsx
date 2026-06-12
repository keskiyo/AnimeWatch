import type { WatchlistTypeFilterProps } from '@/types/watchlist'
import { WatchlistFilterDropdown } from './WatchlistFilterDropdown'

export function WatchlistTypeFilter({
	group,
	selected,
	onToggle,
	onClear,
}: WatchlistTypeFilterProps) {
	const title = group.title || 'Фильтр'
	const selectedCount = group.options.filter(option =>
		selected.has(`${title}:${option}`),
	).length
	const value = selectedCount ? `${title}: ${selectedCount}` : undefined

	return (
		<WatchlistFilterDropdown
			label={title}
			value={value}
			onClear={onClear}
		>
			<div className='grid'>
				{group.options.map(option => {
					const key = `${title}:${option}`
					return (
						<label
							key={key}
							className='flex cursor-pointer items-center gap-2 border-b border-aw-border py-1.5 text-sm text-aw-text last:border-b-0'
						>
							<input
								type='checkbox'
								checked={selected.has(key)}
								onChange={() => onToggle(key)}
								className="grid size-3.75 appearance-none place-content-center rounded border border-[#3c3f40] bg-transparent before:size-2.25 before:scale-0 before:rounded-xs before:bg-aw-accent before:transition-transform before:content-[''] checked:border-aw-accent checked:before:scale-100"
							/>
							{option}
						</label>
					)
				})}
			</div>
		</WatchlistFilterDropdown>
	)
}
