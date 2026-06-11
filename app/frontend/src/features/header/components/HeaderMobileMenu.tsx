import { HeaderUserChip } from '@/features/header/components/HeaderUserChip'
import { NAV_ITEMS } from '@/utils/catalogData'
import { Menu, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

type HeaderMobileMenuProps = {
	onOpenSearch: () => void
	onOpenAuth: () => void
}

/** Burger button + dropdown shown below 1024px. */
export function HeaderMobileMenu({
	onOpenSearch,
	onOpenAuth,
}: HeaderMobileMenuProps) {
	const [isOpen, setIsOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		function onClickDocument(event: MouseEvent) {
			if (!menuRef.current?.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}
		if (isOpen) {
			document.addEventListener('mousedown', onClickDocument)
		}
		return () => document.removeEventListener('mousedown', onClickDocument)
	}, [isOpen])

	return (
		<div
			className='relative hidden justify-self-end max-[1024px]:block'
			ref={menuRef}
		>
			<button
				type='button'
				className='inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-aw-border bg-aw-surface text-aw-text'
				aria-label='Открыть меню'
				aria-expanded={isOpen}
				onClick={() => setIsOpen(value => !value)}
			>
				{isOpen ? (
					<X size={21} aria-hidden='true' />
				) : (
					<Menu size={21} aria-hidden='true' />
				)}
			</button>
			{isOpen && (
				<div className='absolute right-0 top-12 z-30 w-65 rounded-lg border border-aw-border bg-aw-header p-3 shadow-[0_18px_42px_rgba(0,0,0,0.38)]'>
					<nav className='grid gap-1' aria-label='Мобильная навигация'>
						{NAV_ITEMS.map(item => (
							<Link
								key={item}
								to={item === 'Аниме' ? '/anime' : '/ongoing'}
								className='rounded-md px-3 py-2 text-aw-text transition-colors hover:bg-aw-elevated'
								onClick={() => setIsOpen(false)}
							>
								{item}
							</Link>
						))}
					</nav>
					<div className='mt-3 border-t border-aw-border pt-3'>
						<button
							onClick={() => {
								setIsOpen(false)
								onOpenSearch()
							}}
							className='flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-3 py-2 text-left text-aw-subtle hover:bg-aw-elevated hover:text-aw-text'
							aria-label='Поиск'
						>
							<Search size={18} aria-hidden='true' />
							Поиск
						</button>
						<HeaderUserChip
							variant='menu'
							onNavigate={() => setIsOpen(false)}
							onRequestAuth={() => {
								setIsOpen(false)
								onOpenAuth()
							}}
						/>
					</div>
				</div>
			)}
		</div>
	)
}
