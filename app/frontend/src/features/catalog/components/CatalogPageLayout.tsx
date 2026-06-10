import { FilterSidebar } from '@/features/catalog/components/FilterSidebar'
import { SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

type CatalogPageLayoutProps = {
	/** The catalog list component rendered next to the filter sidebar. */
	children: ReactNode
}

/**
 * Shared shell for catalog pages: desktop sidebar on the right,
 * mobile filter button + slide-in drawer.
 */
export function CatalogPageLayout({ children }: CatalogPageLayoutProps) {
	const [isFilterOpen, setIsFilterOpen] = useState(false)

	useEffect(() => {
		document.body.style.overflow = isFilterOpen ? 'hidden' : ''

		return () => {
			document.body.style.overflow = ''
		}
	}, [isFilterOpen])

	return (
		<main className='mx-auto max-w-345 px-4 py-6.5 pb-10'>
			<div className='mb-3 hidden justify-end max-[1024px]:flex'>
				<button
					type='button'
					className='inline-flex cursor-pointer items-center gap-2 rounded-md border border-aw-border bg-aw-surface px-3 py-2 text-aw-text transition-colors hover:bg-aw-elevated'
					aria-expanded={isFilterOpen}
					aria-controls='catalog-filter-drawer'
					onClick={() => setIsFilterOpen(true)}
				>
					<SlidersHorizontal size={17} aria-hidden='true' />
					Фильтр
				</button>
			</div>
			<div className='grid justify-center gap-6 grid-cols-[minmax(0,980px)_300px] max-[1024px]:grid-cols-[minmax(0,1fr)]'>
				{children}
				<div className='max-[1024px]:hidden'>
					<FilterSidebar />
				</div>
			</div>
			<div
				className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 min-[1025px]:hidden ${
					isFilterOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
				}`}
				aria-hidden={!isFilterOpen}
				onClick={() => setIsFilterOpen(false)}
			/>
			<aside
				id='catalog-filter-drawer'
				className={`fixed right-0 top-0 z-50 h-dvh w-[min(390px,92vw)] overflow-y-auto border-l border-aw-border bg-aw-bg p-5 shadow-[-18px_0_44px_rgba(0,0,0,0.42)] transition-transform duration-300 ease-out min-[1025px]:hidden ${
					isFilterOpen ? 'translate-x-0' : 'translate-x-full'
				}`}
				aria-hidden={!isFilterOpen}
			>
				<div className='mb-5 flex items-center justify-end'>
					<button
						type='button'
						className='inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-aw-border bg-aw-surface text-aw-text'
						aria-label='Закрыть фильтр'
						onClick={() => setIsFilterOpen(false)}
					>
						<X size={21} aria-hidden='true' />
					</button>
				</div>
				<FilterSidebar />
			</aside>
		</main>
	)
}
