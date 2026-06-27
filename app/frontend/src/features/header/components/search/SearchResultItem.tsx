import { PosterImage } from '@/components/anime/PosterImage'
import type { Anime } from '@/types/anime'
import { formatAnimeType } from '@/utils/animepage/animePageLabels'
import { formatAnimeRating, getAnimeRatingColor } from '@/utils/anime/animeRating'
import { createAnimeSlug } from '@/utils/anime/animeSlug'
import { prefetchAnimePage } from '@/utils/anime/prefetchAnime'
import { Link } from 'react-router-dom'

type SearchResultItemProps = {
	anime: Anime
	onNavigate: () => void
}

export function SearchResultItem({ anime, onNavigate }: SearchResultItemProps) {
	const slug = createAnimeSlug(anime.id, anime.title_en || anime.title_ru)

	return (
		<li>
			<Link
				to={`/anime/${slug}`}
				onClick={onNavigate}
				onMouseEnter={() => prefetchAnimePage(anime.id)}
				onFocus={() => prefetchAnimePage(anime.id)}
				className='flex items-center gap-3 px-4 py-3 no-underline hover:bg-aw-elevated'
			>
				<div className='relative h-16 w-12 shrink-0 overflow-hidden rounded bg-aw-elevated'>
					<PosterImage
						url={anime.poster_url}
						title={anime.title_en || anime.title_ru}
						placeholderClassName='flex h-full items-center justify-center text-xs font-bold text-aw-subtle'
					/>
				</div>
				<div className='min-w-0 flex-1'>
					<p className='m-0 truncate font-medium leading-snug text-aw-text'>
						{anime.title_ru || anime.title_en}
					</p>
					{anime.title_en && anime.title_en !== anime.title_ru && (
						<p className='m-0 truncate text-sm leading-snug text-aw-subtle'>
							{anime.title_en}
						</p>
					)}
					<p className='m-0 mt-1 text-xs text-aw-subtle'>
						{formatAnimeType(anime.type)}
						{anime.year > 0 && <> · {anime.year}</>}
					</p>
				</div>
				<span
					className={`shrink-0 rounded px-1.5 py-0.5 text-sm font-bold leading-none ${getAnimeRatingColor(anime.rating)}`}
				>
					{formatAnimeRating(anime.rating)}
				</span>
			</Link>
		</li>
	)
}
