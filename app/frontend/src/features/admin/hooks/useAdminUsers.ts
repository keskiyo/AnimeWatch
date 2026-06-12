import { getAdminUsers } from '@/api/adminApi'
import type { AdminUser } from '@/types/admin'
import { useEffect, useState } from 'react'

type State =
	| { status: 'loading'; users: AdminUser[]; total: number }
	| { status: 'ready'; users: AdminUser[]; total: number }
	| { status: 'error'; users: AdminUser[]; total: number }

export function useAdminUsers(search: string, enabled: boolean) {
	const [state, setState] = useState<State>({
		status: 'loading',
		users: [],
		total: 0,
	})

	useEffect(() => {
		if (!enabled) return
		let cancelled = false
		const timeout = window.setTimeout(() => {
			setState(prev => ({
				status: 'loading',
				users: prev.users,
				total: prev.total,
			}))
			getAdminUsers({ search, limit: 50 })
				.then(result => {
					if (!cancelled) {
						setState({
							status: 'ready',
							users: result.data,
							total: result.total,
						})
					}
				})
				.catch(() => {
					if (!cancelled) {
						setState(prev => ({
							status: 'error',
							users: prev.users,
							total: prev.total,
						}))
					}
				})
		}, 220)

		return () => {
			cancelled = true
			window.clearTimeout(timeout)
		}
	}, [enabled, search])

	return state
}
