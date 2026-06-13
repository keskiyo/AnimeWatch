import { getAdminAudit } from '@/api/adminApi'
import type { AdminAuditLog } from '@/types/admin'
import { useEffect, useState } from 'react'

type State =
	| { status: 'loading'; logs: AdminAuditLog[]; total: number; page: number }
	| { status: 'ready'; logs: AdminAuditLog[]; total: number; page: number }
	| { status: 'error'; logs: AdminAuditLog[]; total: number; page: number }

export function useAdminAudit(enabled: boolean, page = 1, refreshKey = 0) {
	const [state, setState] = useState<State>({
		status: 'loading',
		logs: [],
		total: 0,
		page: 1,
	})

	useEffect(() => {
		if (!enabled) return
		let cancelled = false
		setState(prev => ({
			status: 'loading',
			logs: prev.logs,
			total: prev.total,
			page: prev.page,
		}))
		getAdminAudit(page, 20)
			.then(result => {
				if (!cancelled) {
					setState({
						status: 'ready',
						logs: result.data,
						total: result.total,
						page: result.page,
					})
				}
			})
			.catch(() => {
				if (!cancelled) {
					setState(prev => ({
						status: 'error',
						logs: prev.logs,
						total: prev.total,
						page: prev.page,
					}))
				}
			})
		return () => {
			cancelled = true
		}
	}, [enabled, page, refreshKey])

	return state
}
