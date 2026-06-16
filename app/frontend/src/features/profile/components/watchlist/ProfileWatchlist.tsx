import { getUserWatchlist, getWatchlist } from '@/api/watchlistApi'
import { WatchlistCard } from '@/features/profile/components/watchlist/WatchlistCard'
import { WatchlistFilters } from '@/features/profile/components/watchlist/WatchlistFilters'
import { WatchlistTabs } from '@/features/profile/components/watchlist/WatchlistTabs'
import type { WatchlistEntry, WatchlistStatus } from '@/types/anime'
import type { WatchlistFilterState } from '@/types/watchlist'
import {
	filterWatchlistEntries,
	sortWatchlistEntries,
} from '@/utils/watchlist/watchlist'
import { WATCHLIST_LABELS } from '@/utils/watchlist/watchlistData'
import { useEffect, useMemo, useState } from 'react'

type ProfileWatchlistProps = {
	userId: number
	isOwn?: boolean
}

type State =
	| { status: 'loading' }
	| { status: 'ready'; entries: WatchlistEntry[] }

const CURRENT_YEAR = new Date().getFullYear()

function defaultFilters(): WatchlistFilterState {
	return {
		query: '',
		genres: new Set(),
		isStrictMatch: false,
		groups: new Set(),
		fromYear: 1959,
		toYear: CURRENT_YEAR,
		sort: 'date-desc',
	}
}

export function ProfileWatchlist({ userId, isOwn }: ProfileWatchlistProps) {
	const [active, setActive] = useState<WatchlistStatus>('watching')
	const [state, setState] = useState<State>({ status: 'loading' })
	const [filters, setFilters] = useState<WatchlistFilterState>(defaultFilters)

	useEffect(() => {
		let cancelled = false
		setState({ status: 'loading' })
		const request = isOwn ? getWatchlist() : getUserWatchlist(userId)
		request.then(entries => {
			if (!cancelled) setState({ status: 'ready', entries })
		})
		return () => {
			cancelled = true
		}
	}, [isOwn, userId])

	const entries = state.status === 'ready' ? state.entries : []
	const activeEntries = useMemo(
		() => entries.filter(entry => entry.status === active),
		[active, entries],
	)
	const visible = useMemo(
		() =>
			sortWatchlistEntries(
				filterWatchlistEntries(activeEntries, filters),
				filters.sort,
			),
		[activeEntries, filters],
	)

	return (
		<section className='rounded-lg bg-aw-surface p-6'>
			<div className='mb-4 flex flex-wrap items-end justify-between gap-3'>
				<div>
					<h2 className='m-0 text-2xl font-semibold text-aw-text'>
						Список аниме
					</h2>
					<p className='m-0 mt-1 text-sm text-aw-subtle'>
						Категории пользователя и выбранные тайтлы.
					</p>
				</div>
			</div>
			<WatchlistTabs
				active={active}
				entries={entries}
				onChange={next => {
					setActive(next)
					setFilters(defaultFilters())
				}}
			/>
			<div className='mt-4'>
				<WatchlistFilters
					filters={filters}
					onChange={setFilters}
				/>
			</div>
			<div className='mt-5 grid gap-3'>
				{state.status === 'loading' ? (
					<WatchlistSkeleton />
				) : visible.length > 0 ? (
					visible.map(entry => (
						<WatchlistCard
							key={`${entry.anime_id}-${entry.status}`}
							entry={entry}
						/>
					))
				) : (
					<p className='m-0 rounded-md bg-aw-muted p-4 text-aw-subtle'>
						В категории «{WATCHLIST_LABELS[active]}» пока нет аниме.
					</p>
				)}
			</div>
		</section>
	)
}

function WatchlistSkeleton() {
	return Array.from({ length: 3 }).map((_, index) => (
		<div
			key={index}
			className='flex animate-pulse gap-4 rounded-md bg-aw-muted p-3'
		>
			<span className='h-36 w-24 rounded-md bg-aw-elevated' />
			<span className='mt-2 h-6 w-2/3 rounded bg-aw-elevated' />
		</div>
	))
}
