import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type NotFoundPageProps = {
	title?: string
	message?: string
}

export function NotFoundPage({
	title = 'Страница не найдена',
	message = 'Такой страницы не существует или она была удалена.',
}: NotFoundPageProps) {
	const navigate = useNavigate()
	const [imgFailed, setImgFailed] = useState(false)

	return (
		<main className='flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12'>
			<div className='flex flex-col items-center gap-8 sm:flex-row sm:items-end sm:gap-12'>
				{/* Левая часть — карточка ошибки */}
				<div className='relative flex flex-col items-center justify-center rounded-2xl border-4 border-[#e84d60] bg-[#fde8eb] px-10 py-8 shadow-2xl'>
					<span className='block text-[5.5rem] font-black leading-none tracking-tighter text-[#e84d60]'>
						404
					</span>
					<span className='mt-1 text-2xl font-extrabold uppercase tracking-widest text-[#e84d60]'>
						ERROR!
					</span>
					<p className='mt-4 max-w-55 text-center text-sm text-[#c0304a]'>
						{title}
					</p>
					<p className='mt-1 max-w-55 text-center text-xs text-[#c0304a]/70'>
						{message}
					</p>

					<div className='mt-6 flex flex-wrap justify-center gap-3'>
						<button
							type='button'
							onClick={() => navigate(-1)}
							className='cursor-pointer rounded-lg bg-[#e84d60] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#c0304a] active:scale-95'
						>
							← Назад
						</button>
						<Link
							to='/anime'
							className='rounded-lg border-2 border-[#e84d60] px-5 py-2 text-sm font-semibold text-[#e84d60] no-underline transition hover:bg-[#fcd0d7] active:scale-95'
						>
							В каталог
						</Link>
					</div>
				</div>

				{/* Правая часть — аниме-персонаж */}
				{!imgFailed ? (
					<img
						src='/404_page.png'
						alt='404_page'
						className='w-55 object-contain sm:w-70'
						onError={() => setImgFailed(true)}
					/>
				) : (
					/* CSS fallback если изображение не загрузилось */
					<div className='flex flex-col items-center gap-2 text-6xl select-none'>
						<span>🤔</span>
						<span className='text-base text-aw-subtle'>
							( ˘・з・)
						</span>
					</div>
				)}
			</div>
		</main>
	)
}
