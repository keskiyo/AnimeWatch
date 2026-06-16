import type { WatchlistGenreFilterProps } from '@/types/watchlist'
import { filterGenreOptions } from '@/utils/catalog/catalogData'
import { useMemo, useState } from 'react'
import { WatchlistFilterDropdown } from './WatchlistFilterDropdown'

export function WatchlistGenreFilter(props: WatchlistGenreFilterProps) {
	const [search, setSearch] = useState('')
	const options = useMemo(() => filterGenreOptions(search), [search])
	const value = props.genres.size ? `Жанры: ${props.genres.size}` : undefined

	return (
		<WatchlistFilterDropdown
			label='Жанры'
			value={value}
			onClear={props.onClear}
		>
			<input
				value={search}
				onChange={event => setSearch(event.target.value)}
				placeholder='Искать'
				className='mb-2 h-8 w-full rounded-md border border-aw-border bg-aw-elevated px-3 text-sm text-aw-text placeholder:text-aw-subtle'
			/>
			<div className='grid max-h-64 overflow-y-auto pr-1 [scrollbar-color:#9b9da0_transparent]'>
				{options.map(genre => (
					<label
						key={genre}
						className='flex cursor-pointer items-center gap-2 border-b border-aw-border py-1.5 text-sm text-aw-text last:border-b-0'
					>
						<input
							type='checkbox'
							checked={props.genres.has(genre)}
							onChange={() => props.onToggleGenre(genre)}
							className="grid size-3.75 appearance-none place-content-center rounded border border-[#3c3f40] bg-transparent before:size-2.25 before:scale-0 before:rounded-xs before:bg-aw-accent before:transition-transform before:content-[''] checked:border-aw-accent checked:before:scale-100"
						/>
						{genre}
					</label>
				))}
			</div>
		</WatchlistFilterDropdown>
	)
}
