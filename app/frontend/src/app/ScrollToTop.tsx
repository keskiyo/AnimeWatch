import { progress } from '@/app/progressStore'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset scroll to the top on every route change (SPAs keep the old position
 *  otherwise, which feels broken when opening a title from a scrolled catalog).
 *  Also fires a short progress-bar pulse so navigation always feels responsive. */
export function ScrollToTop() {
	const { pathname } = useLocation()

	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
		progress.pulse()
	}, [pathname])

	return null
}
