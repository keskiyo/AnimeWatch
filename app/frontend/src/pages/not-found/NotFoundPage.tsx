import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type NotFoundPageProps = {
	title?: string
	message?: string
}

export function NotFoundPage({
	title = 'Страница не найдена',
	message = 'Такой страницы нет в каталоге или она ещё не загружена.',
}: NotFoundPageProps) {
	const navigate = useNavigate()
	const [imgFailed, setImgFailed] = useState(false)

	return (
		<main className='flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12'>
			<section className='flex w-full max-w-107.5 flex-col items-center rounded-2xl border-4 border-[#f05269] bg-[#fde7eb] px-9 py-10 text-center shadow-2xl shadow-black/35 sm:max-w-117.5 sm:px-11 sm:py-12'>
				{!imgFailed ? (
					<img
						src='/404_page.png'
						alt='Иллюстрация ошибки 404'
						className='mb-8 w-full max-w-87.5 object-contain drop-shadow-[0_18px_30px_rgba(192,48,74,0.16)] sm:max-w-97.5'
						onError={() => setImgFailed(true)}
					/>
				) : (
					<div className='mb-8 rounded-2xl border border-[#f05269] bg-white/40 px-8 py-6 text-center text-[#c0304a]'>
						Иллюстрация недоступна
					</div>
				)}

				<p className='m-0 text-base font-bold text-[#c0304a]'>
					{title}
				</p>
				<p className='m-0 mt-3 max-w-70 text-sm leading-relaxed text-[#c0304a]/75'>
					{message}
				</p>

				<div className='mt-8 flex flex-wrap justify-center gap-3.5'>
					<button
						type='button'
						onClick={() => navigate(-1)}
						className='h-11 cursor-pointer rounded-lg bg-[#e84d60] px-6 text-base font-semibold text-white transition hover:bg-[#c0304a] active:scale-95'
					>
						← Назад
					</button>
					<Link
						to='/anime'
						className='inline-flex h-11 items-center rounded-lg border-2 border-[#e84d60] px-6 text-base font-semibold text-[#e84d60] no-underline transition hover:bg-[#fcd0d7] active:scale-95'
					>
						В каталог
					</Link>
				</div>
			</section>
		</main>
	)
}
