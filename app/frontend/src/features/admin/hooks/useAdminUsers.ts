import { getAdminUsers } from '@/api/adminApi'
import type { AdminUser } from '@/types/admin'
import { useEffect, useState } from 'react'

type State =
	| { status: 'loading'; users: AdminUser[]; total: number; page: number }
	| { status: 'ready'; users: AdminUser[]; total: number; page: number }
	| { status: 'error'; users: AdminUser[]; total: number; page: number }

export function useAdminUsers(
	search: string,
	role: '' | 'user' | 'admin',
	blocked: '' | '0' | '1',
	page: number,
	enabled: boolean,
	refreshKey = 0,
) {
	const [state, setState] = useState<State>({
		status: 'loading',
		users: [],
		total: 0,
		page: 1,
	})

	useEffect(() => {
		if (!enabled) return
		let cancelled = false
		const timeout = window.setTimeout(() => {
			setState(prev => ({
				status: 'loading',
				users: prev.users,
				total: prev.total,
				page: prev.page,
			}))
			getAdminUsers({ search, role, blocked, page, limit: 20 })
				.then(result => {
					if (!cancelled) {
						setState({
							status: 'ready',
							users: result.data,
							total: result.total,
							page: result.page,
						})
					}
				})
				.catch(() => {
					if (!cancelled) {
						setState(prev => ({
							status: 'error',
							users: prev.users,
							total: prev.total,
							page: prev.page,
						}))
					}
				})
		}, 220)

		return () => {
			cancelled = true
			window.clearTimeout(timeout)
		}
	}, [enabled, search, role, blocked, page, refreshKey])

	return state
}
