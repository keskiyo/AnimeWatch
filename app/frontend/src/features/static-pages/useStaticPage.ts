import { getStaticPage } from '@/api/pagesApi'
import type { StaticPage, StaticPageSlug } from '@/types/staticPage'
import { useEffect, useState } from 'react'

type State =
	| { status: 'loading'; page: StaticPage | null }
	| { status: 'ready'; page: StaticPage }
	| { status: 'error'; page: null }

export function useStaticPage(slug: StaticPageSlug) {
	const [state, setState] = useState<State>({ status: 'loading', page: null })

	useEffect(() => {
		let cancelled = false
		setState({ status: 'loading', page: null })
		getStaticPage(slug)
			.then(page => {
				if (!cancelled) setState({ status: 'ready', page })
			})
			.catch(() => {
				if (!cancelled) setState({ status: 'error', page: null })
			})
		return () => {
			cancelled = true
		}
	}, [slug])

	return state
}
