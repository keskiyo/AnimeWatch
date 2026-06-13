import { getAdminStaticPages } from '@/api/adminApi'
import type { AdminStaticPage } from '@/types/admin'
import { useEffect, useState } from 'react'

type State =
	| { status: 'loading'; pages: AdminStaticPage[] }
	| { status: 'ready'; pages: AdminStaticPage[] }
	| { status: 'error'; pages: AdminStaticPage[] }

export function useAdminStaticPages(enabled: boolean, refreshKey = 0) {
	const [state, setState] = useState<State>({ status: 'loading', pages: [] })

	useEffect(() => {
		if (!enabled) return
		let cancelled = false
		setState(prev => ({ status: 'loading', pages: prev.pages }))
		getAdminStaticPages()
			.then(result => {
				if (!cancelled) setState({ status: 'ready', pages: result.data })
			})
			.catch(() => {
				if (!cancelled) {
					setState(prev => ({ status: 'error', pages: prev.pages }))
				}
			})
		return () => {
			cancelled = true
		}
	}, [enabled, refreshKey])

	return state
}
