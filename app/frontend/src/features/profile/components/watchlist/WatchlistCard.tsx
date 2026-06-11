import { PosterImage } from '@/components/anime/PosterImage'
import type { WatchlistEntry } from '@/types/anime'
import { formatAnimeRating } from '@/utils/animeRating'
import { createAnimeSlug } from '@/utils/animeSlug'
import { getWatchlistTitle, WATCHLIST_TYPE_LABELS } from '@/utils/watchlist'
import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'

type WatchlistCardProps = {
	entry: WatchlistEntry
}

export function WatchlistCard({ entry }: WatchlistCardProps) {
	const anime = entry.anime
	const title = anime ? getWatchlistTitle(anime) : 'Неизвестно'
	const rating = anime?.rating ?? 0
	const slug = anime ? createAnimeSlug(anime.id, anime.title_en || title) : ''
	const content = (
		<>
			<div className='h-36 w-24 shrink-0 overflow-hidden rounded-md bg-aw-elevated'>
				<PosterImage
					url={anime?.poster_url}
					title={title}
					placeholderClassName='flex h-full w-full items-center justify-center px-2 text-center text-xl font-black text-white/60'
				/>
			</div>
			<div className='min-w-0 flex-1'>
				<h3 className='m-0 line-clamp-2 text-lg leading-tight text-aw-accent'>
					{title}
				</h3>
				<p className='m-0 mt-1 text-sm text-aw-subtle'>
					{anime?.title_en || 'Неизвестно'}
				</p>
				<p className='m-0 mt-2 text-sm text-aw-text'>
					{anime ? WATCHLIST_TYPE_LABELS[anime.type] || anime.type : 'Неизвестно'}
					{anime?.year ? ` / ${anime.year}` : ''}
				</p>
				<p className='m-0 mt-2 line-clamp-1 text-sm text-aw-subtle'>
					{anime?.genres.length ? anime.genres.join(', ') : 'Неизвестно'}
				</p>
			</div>
			<div className='ml-auto inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-aw-text'>
				<Star size={17} fill='#f5d124' className='text-[#f5d124]' />
				{formatAnimeRating(rating)}
			</div>
		</>
	)

	if (!anime) {
		return (
			<div className='flex gap-4 rounded-md bg-aw-muted p-3'>{content}</div>
		)
	}

	return (
		<Link
			to={`/anime/${slug}`}
			className='flex gap-4 rounded-md bg-aw-muted p-3 transition hover:bg-aw-elevated'
		>
			{content}
		</Link>
	)
}
