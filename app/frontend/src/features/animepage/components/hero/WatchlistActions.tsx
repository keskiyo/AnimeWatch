import { getWatchlist, toggleWatchlistStatus } from '@/api/watchlistApi'
import { useAuthUser } from '@/features/auth/useAuthUser'
import type { WatchlistStatus } from '@/types/anime'
import { notifyError, notifySuccess } from '@/utils/notify'
import { WATCHLIST_LABELS, WATCHLIST_STATUSES } from '@/utils/watchlist/watchlistData'
import { Cloud, Clock, Eye, EyeOff, Flag } from 'lucide-react'
import { useEffect, useState } from 'react'

type WatchlistActionsProps = {
	animeId: number
}

const ICONS = {
	watching: Eye,
	plan_to_watch: Cloud,
	completed: Flag,
	on_hold: Clock,
	dropped: EyeOff,
} satisfies Record<WatchlistStatus, typeof Eye>

export function WatchlistActions({ animeId }: WatchlistActionsProps) {
	const { user, isInitialized } = useAuthUser()
	const [active, setActive] = useState<Set<WatchlistStatus>>(new Set())
	const [pending, setPending] = useState<WatchlistStatus | null>(null)

	useEffect(() => {
		if (!isInitialized || !user) {
			setActive(new Set())
			return
		}

		let cancelled = false
		getWatchlist().then(items => {
			if (cancelled) return
			setActive(
				new Set(
					items
						.filter(item => item.anime_id === animeId)
						.map(item => item.status),
				),
			)
		})

		return () => {
			cancelled = true
		}
	}, [animeId, isInitialized, user])

	async function onToggle(status: WatchlistStatus) {
		if (!user) {
			notifyError('Войдите, чтобы добавить аниме в список')
			return
		}

		// Optimistic: paint the new state instantly (one status per title), then
		// reconcile with the server — revert if it fails.
		const previous = active
		const willActivate = !active.has(status)
		setActive(willActivate ? new Set([status]) : new Set())
		setPending(status)
		try {
			const result = await toggleWatchlistStatus(animeId, status)
			setActive(new Set(result.statuses))
			notifySuccess(
				result.active
					? `Добавлено: ${WATCHLIST_LABELS[status]}`
					: `Убрано: ${WATCHLIST_LABELS[status]}`,
			)
		} catch {
			setActive(previous) // revert on failure
			notifyError('Не удалось обновить список')
		} finally {
			setPending(null)
		}
	}

	return (
		<div className='grid grid-cols-5 overflow-hidden rounded-md border border-aw-border bg-aw-muted'>
			{WATCHLIST_STATUSES.map(status => {
				const Icon = ICONS[status]
				const isActive = active.has(status)
				return (
					<button
						key={status}
						type='button'
						aria-label={WATCHLIST_LABELS[status]}
						title={WATCHLIST_LABELS[status]}
						disabled={pending === status}
						onClick={() => void onToggle(status)}
						className={`flex h-10 cursor-pointer items-center justify-center border-r border-aw-border text-sm transition last:border-r-0 disabled:cursor-default ${
							isActive
								? 'bg-aw-accent text-white'
								: 'text-aw-text hover:bg-aw-elevated hover:text-aw-accent'
						}`}
					>
						<Icon size={17} aria-hidden='true' />
					</button>
				)
			})}
		</div>
	)
}
