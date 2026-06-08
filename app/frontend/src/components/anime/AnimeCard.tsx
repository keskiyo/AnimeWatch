import { StatusBadge } from '@/components/ui/StatusBadge'
import type { AnimeCardProps } from '@/types/anime'
import { createAnimeSlug } from '@/utils/animeSlug'
import { formatProgressLabel, formatRating } from '@/utils/formatters'
import { Heart, Play, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AnimeCard({ anime, progress }: AnimeCardProps) {
	const slug = createAnimeSlug(anime.id, anime.title_en || anime.title_ru)

	return (
		<Link
			to={`/anime/${slug}`}
			aria-label={`Open ${anime.title_en}`}
			className='grid min-w-0 overflow-hidden rounded-lg border border-aw-border bg-aw-surface transition hover:-translate-y-0.5 hover:border-aw-accent/70'
		>
			<div className='relative aspect-2/3 min-h-0 overflow-hidden bg-aw-muted'>
				<img
					className='h-full w-full object-cover'
					src={anime.poster_url}
					alt={`${anime.title_en} poster`}
					loading='lazy'
				/>
				<span className='absolute right-2 top-2 inline-flex min-h-7 items-center gap-1 rounded border border-white/10 bg-[rgba(13,17,23,0.84)] px-2 text-[0.82rem] font-extrabold text-aw-warning'>
					<Star aria-hidden='true' size={14} fill='currentColor' />
					{formatRating(anime.rating)}
				</span>
				<span className='absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-linear-to-b from-transparent to-[rgba(13,17,23,0.88)] p-4 opacity-0 transition-opacity hover:opacity-100'>
					<Play size={18} />
					<Heart size={18} />
				</span>
			</div>
			<div className='grid gap-2 p-3'>
				<h3 className='m-0 line-clamp-2 min-h-[2.5em] overflow-hidden text-[0.98rem] leading-tight text-aw-text'>
					{anime.title_en}
				</h3>
				<div className='flex min-w-0 gap-2 text-[0.82rem] text-aw-subtle'>
					<span className='overflow-hidden text-ellipsis whitespace-nowrap'>
						{anime.year}
					</span>
					<span className='overflow-hidden text-ellipsis whitespace-nowrap'>
						{anime.studio}
					</span>
				</div>
				<div className='flex items-center justify-between gap-2'>
					<StatusBadge status={anime.status} />
					<span className='overflow-hidden text-ellipsis whitespace-nowrap text-right text-[0.76rem] text-aw-subtle'>
						{formatProgressLabel(progress, anime.episodes_total)}
					</span>
				</div>
			</div>
		</Link>
	)
}
