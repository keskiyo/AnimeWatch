import type { WatchlistFilterDropdownProps } from '@/types/watchlist'
import { ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function WatchlistFilterDropdown({
	label,
	value,
	children,
	onClear,
}: WatchlistFilterDropdownProps) {
	const [isOpen, setIsOpen] = useState(false)
	const rootRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		function onMouseDown(event: MouseEvent) {
			if (!rootRef.current?.contains(event.target as Node))
				setIsOpen(false)
		}
		if (isOpen) document.addEventListener('mousedown', onMouseDown)
		return () => document.removeEventListener('mousedown', onMouseDown)
	}, [isOpen])

	return (
		<div ref={rootRef} className='relative'>
			<button
				type='button'
				onClick={() => setIsOpen(value => !value)}
				className='inline-flex h-9 cursor-pointer items-center gap-1 rounded-md border border-aw-border bg-aw-elevated px-3 text-sm text-aw-text transition hover:border-aw-accent'
			>
				{value || label}
				<ChevronDown size={14} aria-hidden='true' />
			</button>
			{isOpen && (
				<div className='absolute left-0 top-11 z-20 w-64 rounded-md border border-aw-border bg-aw-surface p-2 shadow-xl'>
					<div className='mb-2 flex items-center justify-between gap-2 text-sm text-aw-subtle'>
						<span>{label}</span>
						<button
							type='button'
							onClick={onClear}
							className='inline-flex cursor-pointer text-aw-subtle hover:text-aw-accent'
							aria-label='Очистить'
						>
							<X size={15} aria-hidden='true' />
						</button>
					</div>
					{children}
				</div>
			)}
		</div>
	)
}
