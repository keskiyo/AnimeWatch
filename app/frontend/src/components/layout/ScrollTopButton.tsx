import { ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'

const SHOW_AFTER_PX = 500

/** Floating «back to top» button — appears after scrolling down a long list. */
export function ScrollTopButton() {
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		function onScroll() {
			setVisible(window.scrollY > SHOW_AFTER_PX)
		}
		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [])

	return (
		<button
			type='button'
			aria-label='Наверх'
			onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
			className={`fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-aw-border bg-aw-surface text-aw-text shadow-lg shadow-black/40 transition-all duration-200 hover:bg-aw-elevated hover:text-aw-accent ${
				visible
					? 'translate-y-0 opacity-100'
					: 'pointer-events-none translate-y-3 opacity-0'
			}`}
		>
			<ChevronUp size={24} aria-hidden='true' />
		</button>
	)
}
