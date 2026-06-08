import { Search, X } from 'lucide-react'
import { useEffect } from 'react'

interface SearchModalProps {
	isOpen: boolean
	onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
	useEffect(() => {
		function onEscapeKey(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', onEscapeKey)
			document.body.style.overflow = 'hidden'
		}

		return () => {
			document.removeEventListener('keydown', onEscapeKey)
			document.body.style.overflow = ''
		}
	}, [isOpen, onClose])

	if (!isOpen) return null

	return (
		<div className='fixed inset-0 z-50 bg-aw-surface animate-slideUpFade'>
			<div className='mx-auto max-w-345 px-4 pt-6'>
				<div className='flex items-center justify-between'>
					<h2 className='text-xl font-semibold text-aw-text'>
						Поиск
					</h2>
					<button
						onClick={onClose}
						className='inline-flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-aw-subtle transition-colors hover:bg-aw-elevated hover:text-aw-text cursor-pointer'
						aria-label='Закрыть поиск'
					>
						<X size={24} aria-hidden='true' />
					</button>
				</div>

				<div className='relative mt-6'>
					<Search
						size={22}
						className='absolute left-4 top-1/2 -translate-y-1/2 text-aw-subtle'
						aria-hidden='true'
					/>
					<input
						type='text'
						autoFocus
						className='w-full rounded-xl border border-aw-border bg-aw-header py-4 pl-12 pr-4 text-lg text-aw-text placeholder:text-aw-subtle focus:border-aw-accent focus:outline-none focus:ring-2 focus:ring-aw-accent/20'
						placeholder='Начните вводить название аниме'
					/>
				</div>
			</div>
		</div>
	)
}
