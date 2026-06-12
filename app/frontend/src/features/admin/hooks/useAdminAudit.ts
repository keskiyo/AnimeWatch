import { getAdminAudit } from '@/api/adminApi'
import type { AdminAuditLog } from '@/types/admin'
import { useEffect, useState } from 'react'

type State =
	| { status: 'loading'; logs: AdminAuditLog[] }
	| { status: 'ready'; logs: AdminAuditLog[] }
	| { status: 'error'; logs: AdminAuditLog[] }

export function useAdminAudit(enabled: boolean, refreshKey = 0) {
	const [state, setState] = useState<State>({ status: 'loading', logs: [] })

	useEffect(() => {
		if (!enabled) return
		let cancelled = false
		setState(prev => ({ status: 'loading', logs: prev.logs }))
		getAdminAudit(30)
			.then(result => {
				if (!cancelled) setState({ status: 'ready', logs: result.data })
			})
			.catch(() => {
				if (!cancelled) {
					setState(prev => ({ status: 'error', logs: prev.logs }))
				}
			})
		return () => {
			cancelled = true
		}
	}, [enabled, refreshKey])

	return state
}
