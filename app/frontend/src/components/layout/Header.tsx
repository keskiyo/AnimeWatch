import { subscribeAuthModal } from '@/features/auth/authModalBus'
import { AuthModal } from '@/features/header/components/auth/AuthModal'
import { HeaderMobileMenu } from '@/features/header/components/HeaderMobileMenu'
import { HeaderUserChip } from '@/features/header/components/HeaderUserChip'
import { SearchModal } from '@/features/header/components/search/SearchModal'
import { NAV_ITEMS } from '@/utils/catalog/catalogData'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function Header() {
	const [isOpenSearchModal, setIsOpenSearchModal] = useState(false)
	const [isOpenAuthModal, setIsOpenAuthModal] = useState(false)

	// Other components (e.g. «Войдите» in comments) can open the auth modal
	useEffect(() => subscribeAuthModal(() => setIsOpenAuthModal(true)), [])

	return (
		<>
			<header className='sticky top-0 z-40 min-h-16 border-b border-aw-border bg-aw-header/95 backdrop-blur'>
				<div className='mx-auto grid min-h-16 max-w-345 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-8.5 px-4 max-[1024px]:grid-cols-[auto_1fr_auto] max-[1024px]:gap-4'>
					<Link
						to='/'
						aria-label='AnimeWatch home'
						className='text-[31px] font-black leading-none tracking-[-1px] text-aw-text no-underline'
					>
						<span className='text-aw-accent'>Anime</span>Watch
					</Link>

					<nav
						className='flex min-w-0 items-center gap-7.5 max-[1024px]:hidden'
						aria-label='Основная навигация'
					>
						{NAV_ITEMS.map(item => (
							<Link
								key={item.path}
								to={item.path}
								className='whitespace-nowrap text-[15px] text-aw-subtle transition-colors hover:text-aw-text'
							>
								{item.label}
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
						<HeaderUserChip
							variant='desktop'
							onRequestAuth={() => setIsOpenAuthModal(true)}
						/>
					</div>

					<HeaderMobileMenu
						onOpenSearch={() => setIsOpenSearchModal(true)}
						onOpenAuth={() => setIsOpenAuthModal(true)}
					/>
				</div>
			</header>

			<SearchModal
				isOpen={isOpenSearchModal}
				onClose={() => setIsOpenSearchModal(false)}
			/>
			<AuthModal
				isOpen={isOpenAuthModal}
				onClose={() => setIsOpenAuthModal(false)}
			/>
		</>
	)
}
