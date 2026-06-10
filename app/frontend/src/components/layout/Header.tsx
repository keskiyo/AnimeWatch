import { SearchModal } from '@/features/header/components/SearchModal'
import { NAV_ITEMS } from '@/utils/catalogData'
import { Menu, Search, UserCircle, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)
	const [isOpenSearchModal, setIsOpenSearchModal] = useState(false)

	useEffect(() => {
		function onClickDocument(event: MouseEvent) {
			if (!menuRef.current?.contains(event.target as Node)) {
				setIsMenuOpen(false)
			}
		}

		if (isMenuOpen) {
			document.addEventListener('mousedown', onClickDocument)
		}

		return () => document.removeEventListener('mousedown', onClickDocument)
	}, [isMenuOpen])

	return (
		<>
			<header className='sticky top-0 z-40 min-h-16 border-b border-aw-border bg-aw-header/95 backdrop-blur'>
				<div className='mx-auto grid min-h-16 max-w-345 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-8.5 px-4 max-[1024px]:grid-cols-[auto_1fr_auto] max-[1024px]:gap-4'>
					<Link
						to='/'
						aria-label='AnimeWatch home'
						className='text-[31px] font-black leading-none tracking-[-1px] text-aw-text no-underline'
					>
						AnimeWatch
					</Link>
					<nav
						className='flex min-w-0 items-center gap-7.5 max-[1024px]:hidden'
						aria-label='Основная навигация'
					>
						{NAV_ITEMS.map(item => (
							<Link
								key={item}
								to={item === 'Аниме' ? '/anime' : '/ongoing'}
								className='whitespace-nowrap text-[15px] text-aw-subtle transition-colors hover:text-aw-text'
							>
								{item}
							</Link>
						))}
					</nav>
					<div className='flex items-center gap-4.5 justify-self-end max-[1024px]:hidden'>
						<button
							onClick={() => setIsOpenSearchModal(true)}
							className='inline-flex h-9 w-9 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-aw-icon transition-colors hover:text-aw-text'
							aria-label='Поиск'
						>
							<Search size={22} aria-hidden='true' />
						</button>
						<span className='h-6.5 w-px bg-aw-border' />
						<button
							type='button'
							className='inline-flex cursor-pointer items-center gap-1.75 border-0 bg-transparent p-0 text-aw-subtle transition-colors hover:text-aw-text'
						>
							<UserCircle size={24} aria-hidden='true' />
							<span className='max-[520px]:hidden'>Войти</span>
						</button>
					</div>
					<div
						className='relative hidden justify-self-end max-[1024px]:block'
						ref={menuRef}
					>
						<button
							type='button'
							className='inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-aw-border bg-aw-surface text-aw-text'
							aria-label='Открыть меню'
							aria-expanded={isMenuOpen}
							onClick={() => setIsMenuOpen(value => !value)}
						>
							{isMenuOpen ? (
								<X size={21} aria-hidden='true' />
							) : (
								<Menu size={21} aria-hidden='true' />
							)}
						</button>
						{isMenuOpen && (
							<div className='absolute right-0 top-12 z-30 w-65 rounded-lg border border-aw-border bg-aw-header p-3 shadow-[0_18px_42px_rgba(0,0,0,0.38)]'>
								<nav
									className='grid gap-1'
									aria-label='Мобильная навигация'
								>
									{NAV_ITEMS.map(item => (
										<Link
											key={item}
											to={
												item === 'Аниме'
													? '/catalog'
													: '/'
											}
											className='rounded-md px-3 py-2 text-aw-text transition-colors hover:bg-aw-elevated'
											onClick={() => setIsMenuOpen(false)}
										>
											{item}
										</Link>
									))}
								</nav>
								<div className='mt-3 border-t border-aw-border pt-3'>
									<button
										onClick={() =>
											setIsOpenSearchModal(true)
										}
										className='flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-3 py-2 text-left text-aw-subtle hover:bg-aw-elevated hover:text-aw-text'
										aria-label='Поиск'
									>
										<Search size={18} aria-hidden='true' />
										Поиск
									</button>
									<button
										type='button'
										className='mt-1 flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-3 py-2 text-left text-aw-subtle hover:bg-aw-elevated hover:text-aw-text'
									>
										<UserCircle
											size={19}
											aria-hidden='true'
										/>
										Войти
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Модальное окно поиска */}
			<SearchModal
				isOpen={isOpenSearchModal}
				onClose={() => setIsOpenSearchModal(false)}
			/>
		</>
	)
}
