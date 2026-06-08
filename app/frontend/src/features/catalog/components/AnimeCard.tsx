import type { CatalogAnimeCardProps, CatalogViewMode } from '@/types/catalog'
import { formatAnimeRating } from '@/utils/animeRating'
import { createAnimeSlug } from '@/utils/animeSlug'
import { Link } from 'react-router-dom'

const CARD_CLASSES: Record<CatalogViewMode, string> = {
	poster: 'block min-w-0 no-underline',
	compact:
		'grid min-w-0 grid-cols-[110px_minmax(0,1fr)] items-start gap-x-4 no-underline',
	list: 'grid max-w-[720px] min-w-0 grid-cols-[150px_minmax(0,1fr)] items-start gap-x-[18px] no-underline',
}

const POSTER_CLASSES: Record<CatalogViewMode, string> = {
	poster: 'mb-2.5 h-[280px]',
	compact: 'h-[154px]',
	list: 'h-[205px]',
}

export function AnimeCard({
	anime,
	variant = 'poster',
}: CatalogAnimeCardProps) {
	const isHorizontal = variant !== 'poster'
	const title = anime.title_ru || anime.title_en
	const slug = createAnimeSlug(anime.id, anime.title_en || title)

	return (
		<Link
			to={`/anime/${slug}`}
			aria-label={title}
			className={CARD_CLASSES[variant]}
		>
			<div
				className={`group relative row-span-4 flex aspect-3/4 w-full items-end justify-center overflow-hidden rounded-md bg-aw-elevated transition-transform hover:-translate-y-0.5 hover:saturate-[1.08] ${POSTER_CLASSES[variant]}`}
			>
				<span className='absolute left-0 top-2 z-2 min-w-10.5 rounded bg-[#2fc244] px-2 py-1.5 text-center text-[15px] font-bold leading-none text-white'>
					{formatAnimeRating(anime.rating)}
				</span>
				{anime.poster_url ? (
					<img
						className='h-full w-full object-cover'
						src={anime.poster_url}
						alt={`${anime.title_en} poster`}
						loading='lazy'
					/>
				) : (
					<span className='relative px-3 pb-5.5 text-center text-[clamp(24px,5vw,42px)] font-black leading-none text-white/90 [text-shadow:0_5px_18px_rgba(0,0,0,0.48)]'>
						{getPosterLabel(anime.title_en || anime.title_ru)}
					</span>
				)}
			</div>
			<div
				className={`overflow-hidden text-ellipsis whitespace-nowrap text-[13px] leading-tight text-[#b8c0c8] ${
					isHorizontal ? 'order-2 mb-3' : 'order-1 mb-1'
				}`}
			>
				{anime.title_en}
			</div>
			<h3
				className={`m-0 overflow-hidden text-aw-accent ${
					isHorizontal
						? 'order-1 mb-1 line-clamp-2 text-xl leading-tight'
						: 'order-2 mb-2 line-clamp-2 min-h-10.75 text-lg leading-tight'
				}`}
			>
				{title}
			</h3>
			<div
				className={`order-3 overflow-hidden text-sm leading-snug ${
					isHorizontal ? 'text-aw-text' : 'text-aw-subtle'
				} ${variant === 'list' ? 'whitespace-normal' : ''}`}
			>
				<div
					className={`flex items-center gap-2 ${variant === 'list' ? '' : 'whitespace-nowrap'}`}
				>
					{formatAnimeType(anime.type)}
					<span>/</span>
					{anime.year}
				</div>
				{isHorizontal && (
					<div
						className={`overflow-hidden text-ellipsis mt-2 ${variant === 'list' ? '' : 'whitespace-nowrap'}`}
					>
						{anime.genres.join(', ')}
					</div>
				)}
			</div>
			{variant === 'list' && (
				<p className='order-4 col-start-2 mt-3.5 text-[15px] leading-normal text-aw-subtle'>
					{anime.description}
				</p>
			)}
		</Link>
	)
}

function formatAnimeType(value: string): string {
	const labels: Record<string, string> = {
		tv: 'Сериал',
		movie: 'Фильм',
		ova: 'OVA',
		ona: 'ONA',
		special: 'Спешл',
	}

	return labels[value] ?? value
}

function getPosterLabel(value: string): string {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(word => word[0]?.toUpperCase() ?? '')
		.join('')
}
