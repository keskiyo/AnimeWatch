import type {
	WatchlistFilterState,
	WatchlistFiltersProps,
} from '@/types/watchlist'
import { filterGroups } from '@/utils/catalog/catalogData'
import { X } from 'lucide-react'
import { WatchlistGenreFilter } from './WatchlistGenreFilter'
import { WatchlistSortFilter } from './WatchlistSortFilter'
import { WatchlistTypeFilter } from './WatchlistTypeFilter'

export function WatchlistFilters({ filters, onChange }: WatchlistFiltersProps) {
	const typeGroup = filterGroups.find(group => group.title === 'Тип')

	function patch(next: Partial<WatchlistFilterState>) {
		onChange({ ...filters, ...next })
	}

	function toggleSet(key: 'genres' | 'groups', value: string) {
		const next = new Set(filters[key])
		if (next.has(value)) next.delete(value)
		else next.add(value)
		patch({ [key]: next } as Partial<WatchlistFilterState>)
	}

	function clearGroup(title: string) {
		const next = new Set(
			[...filters.groups].filter(value => !value.startsWith(`${title}:`)),
		)
		patch({ groups: next })
	}

	return (
		<div className='flex flex-nowrap items-start gap-2 pb-1'>
			<div className='relative min-w-52 flex-1'>
				<input
					value={filters.query}
					onChange={event => patch({ query: event.target.value })}
					placeholder='Поиск'
					className='h-9 w-full rounded-md border border-aw-border bg-aw-elevated px-3 pr-9 text-sm text-aw-text outline-none transition placeholder:text-aw-subtle focus:border-aw-accent'
				/>
				{filters.query && (
					<button
						type='button'
						onClick={() => patch({ query: '' })}
						aria-label='Очистить поиск'
						className='absolute right-2 top-1/2 inline-flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-aw-subtle transition hover:text-aw-accent'
					>
						<X size={15} aria-hidden='true' />
					</button>
				)}
			</div>
			{typeGroup && (
				<WatchlistTypeFilter
					group={typeGroup}
					selected={filters.groups}
					onToggle={value => toggleSet('groups', value)}
					onClear={() => clearGroup(typeGroup.title || '')}
				/>
			)}
			<WatchlistGenreFilter
				genres={filters.genres}
				isStrictMatch={filters.isStrictMatch}
				onToggleGenre={genre => toggleSet('genres', genre)}
				onStrictChange={() =>
					patch({ isStrictMatch: !filters.isStrictMatch })
				}
				onClear={() => patch({ genres: new Set() })}
			/>
			<WatchlistSortFilter
				value={filters.sort}
				onChange={sort => patch({ sort })}
			/>
		</div>
	)
}
