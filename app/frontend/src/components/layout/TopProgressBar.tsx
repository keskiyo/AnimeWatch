import { useProgressStore } from '@/app/progressStore'
import { useEffect, useRef, useState } from 'react'

/** Thin YouTube-style loading bar at the very top, driven by in-flight work. */
export function TopProgressBar() {
	const active = useProgressStore(s => s.active)
	const [width, setWidth] = useState(0)
	const [visible, setVisible] = useState(false)
	const trickleRef = useRef<number | null>(null)

	useEffect(() => {
		function stopTrickle() {
			if (trickleRef.current !== null) {
				window.clearInterval(trickleRef.current)
				trickleRef.current = null
			}
		}

		if (active > 0) {
			setVisible(true)
			setWidth(w => (w < 8 ? 8 : w))
			if (trickleRef.current === null) {
				// Creep toward 90% while work is pending (never quite reach 100).
				trickleRef.current = window.setInterval(() => {
					setWidth(w => (w < 90 ? w + (90 - w) * 0.12 : w))
				}, 300)
			}
			return stopTrickle
		}

		stopTrickle()
		if (!visible) return
		setWidth(100) // snap to full, then fade out
		const timer = window.setTimeout(() => {
			setVisible(false)
			setWidth(0)
		}, 260)
		return () => window.clearTimeout(timer)
	}, [active, visible])

	if (!visible) return null

	return (
		<div
			className='fixed left-0 top-0 z-[60] h-0.5 bg-aw-accent'
			style={{
				width: `${width}%`,
				transition: 'width 0.2s ease-out, opacity 0.2s ease-out',
				opacity: width >= 100 ? 0 : 1,
				boxShadow: '0 0 8px var(--color-aw-accent)',
			}}
			role='progressbar'
			aria-hidden='true'
		/>
	)
}
