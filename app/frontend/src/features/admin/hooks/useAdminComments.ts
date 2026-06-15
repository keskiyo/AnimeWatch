import { getAdminComments } from '@/api/adminApi'
import type { AdminComment } from '@/types/admin'
import { useEffect, useState } from 'react'

type State = {
	status: 'loading' | 'ready' | 'error'
	comments: AdminComment[]
	total: number
	page: number
}

export function useAdminComments(
	enabled: boolean,
	page: number,
	refreshKey = 0,
) {
	const [state, setState] = useState<State>({
		status: 'loading',
		comments: [],
		total: 0,
		page: 1,
	})

	useEffect(() => {
		if (!enabled) return
		let cancelled = false
		setState(prev => ({ ...prev, status: 'loading' }))
		getAdminComments(page, 20)
			.then(result => {
				if (cancelled) return
				setState({
					status: 'ready',
					comments: result.data,
					total: result.total,
					page: result.page,
				})
			})
			.catch(() => {
				if (!cancelled) setState(prev => ({ ...prev, status: 'error' }))
			})
		return () => {
			cancelled = true
		}
	}, [enabled, page, refreshKey])

	return state
}
