import { SearchResultItem } from '@/features/header/components/search/SearchResultItem'
import { useAnimeSearch } from '@/features/header/hooks/useAnimeSearch'
import type { SearchModalProps } from '@/types/search'
import { Search, X } from 'lucide-react'
import { useDeferredValue, useEffect, useState } from 'react'

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
	const [query, setQuery] = useState('')
	// Keep typing responsive (INP): filter against the deferred value so each
	// keystroke paints immediately while the heavy match runs in the background.
	const deferredQuery = useDeferredValue(query)
	const { results, showResults, isApiLoading, reset } =
		useAnimeSearch(deferredQuery)

	// Reset state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setQuery('')
			reset()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen])

	// Escape key + body scroll lock
	useEffect(() => {
		function onEscapeKey(event: KeyboardEvent) {
			if (event.key === 'Escape') onClose()
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

	const isLoading = isApiLoading && results.length === 0

	return (
		<div
			className='fixed inset-0 z-50 bg-aw-surface animate-slideUpFade'
			role='dialog'
			aria-modal='true'
			aria-label='Поиск аниме'
		>
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
						className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-aw-subtle'
						aria-hidden='true'
					/>
					<input
						type='text'
						autoFocus
						value={query}
						onChange={e => setQuery(e.target.value)}
						className='w-full rounded-xl border border-aw-border bg-aw-header py-4 pl-12 pr-10 text-lg text-aw-text placeholder:text-aw-subtle focus:border-aw-accent focus:outline-none focus:ring-2 focus:ring-aw-accent/20'
						placeholder='Начните вводить название аниме'
					/>
					{query && (
						<button
							onClick={() => setQuery('')}
							className='absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-aw-subtle hover:text-aw-text'
							aria-label='Очистить'
						>
							<X size={18} aria-hidden='true' />
						</button>
					)}
				</div>

				{showResults && (
					<div className='mt-3 overflow-hidden rounded-xl border border-aw-border bg-aw-bg'>
						{isLoading ? (
							<p className='py-5 text-center text-sm text-aw-subtle'>
								Поиск...
							</p>
						) : results.length === 0 ? (
							<p className='py-5 text-center text-sm text-aw-subtle'>
								Ничего не найдено
							</p>
						) : (
							<ul className='max-h-[60vh] divide-y divide-aw-border overflow-y-auto'>
								{results.map(anime => (
									<SearchResultItem
										key={anime.id}
										anime={anime}
										onNavigate={onClose}
									/>
								))}
							</ul>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
