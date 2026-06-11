import { Link } from 'react-router-dom'

export function Footer() {
	return (
		<footer className='flex min-h-18 flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-white/10 bg-[#232323] px-4 py-2 text-white sm:px-8 lg:px-21 max-[650px]:justify-center max-[650px]:py-3 max-[650px]:text-center'>
			<nav className='flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-8 lg:gap-x-11'>
				<Link
					to='/agreement'
					className='text-sm leading-tight text-[#aeb6c2] transition-colors hover:text-white sm:text-base'
				>
					Соглашение
				</Link>

				<Link
					to='/privacy'
					className='text-sm leading-tight text-[#aeb6c2] transition-colors hover:text-white sm:text-base'
				>
					Конфиденциальность
				</Link>

				<Link
					to='/copyright'
					className='text-sm leading-tight text-[#aeb6c2] transition-colors hover:text-white sm:text-base'
				>
					Для правообладателей
				</Link>
			</nav>

			<p className='m-0 ml-auto whitespace-nowrap text-sm leading-tight text-white sm:text-base max-[650px]:ml-0 max-[650px]:w-full'>
				© 2026-2027 AnimeWatch
			</p>
		</footer>
	)
}
