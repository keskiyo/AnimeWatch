import type { AnimeType, WatchlistEntry } from '@/types/anime'
import { WATCHLIST_TYPE_LABELS } from '@/utils/watchlist'
import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

type WatchlistFiltersProps = {
	entries: WatchlistEntry[]
	query: string
	genre: string
	type: string
	sort: string
	onQuery: (value: string) => void
	onGenre: (value: string) => void
	onType: (value: string) => void
	onSort: (value: string) => void
}

export function WatchlistFilters(props: WatchlistFiltersProps) {
	const genres = useMemo(
		() =>
			[
				...new Set(
					props.entries.flatMap(entry => entry.anime?.genres ?? []),
				),
			].sort((a, b) => a.localeCompare(b, 'ru')),
		[props.entries],
	)
	const types = useMemo(
		() => [
			...new Set(
				props.entries
					.map(entry => entry.anime?.type)
					.filter((type): type is AnimeType => Boolean(type)),
			),
		],
		[props.entries],
	)

	return (
		<div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_160px_180px]'>
			<label className='relative block'>
				<Search
					size={17}
					className='absolute left-3 top-1/2 -translate-y-1/2 text-aw-subtle'
					aria-hidden='true'
				/>
				<input
					value={props.query}
					onChange={event => props.onQuery(event.target.value)}
					placeholder='Поиск по названию'
					className='h-10 w-full rounded-md border border-aw-border bg-aw-elevated pl-9 pr-3 text-sm text-aw-text'
				/>
			</label>
			<Select value={props.genre} onChange={props.onGenre}>
				<option value=''>Все жанры</option>
				{genres.map(genre => (
					<option key={genre} value={genre}>
						{genre}
					</option>
				))}
			</Select>
			<Select value={props.type} onChange={props.onType}>
				<option value=''>Все типы</option>
				{types.map(type => (
					<option key={type} value={type}>
						{WATCHLIST_TYPE_LABELS[type] || type}
					</option>
				))}
			</Select>
			<Select value={props.sort} onChange={props.onSort}>
				<option value='date-desc'>Сначала новые</option>
				<option value='date-asc'>Сначала старые</option>
				<option value='title-asc'>Название А-Я</option>
				<option value='title-desc'>Название Я-А</option>
				<option value='rating-desc'>Рейтинг выше</option>
				<option value='rating-asc'>Рейтинг ниже</option>
			</Select>
		</div>
	)
}

function Select({
	value,
	children,
	onChange,
}: {
	value: string
	children: ReactNode
	onChange: (value: string) => void
}) {
	return (
		<select
			value={value}
			onChange={event => onChange(event.target.value)}
			className='h-10 cursor-pointer rounded-md border border-aw-border bg-aw-elevated px-3 text-sm text-aw-text'
		>
			{children}
		</select>
	)
}
