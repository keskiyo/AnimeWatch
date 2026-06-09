import { getCatalog } from '@/api/animeApi'
import { useAnimeCache } from '@/features/catalog/hooks/useAnimeCache'
import type { Anime } from '@/types/anime'
import { formatAnimeRating, getAnimeRatingColor } from '@/utils/animeRating'
import { formatAnimeType } from '@/utils/animePageFormatters'
import { createAnimeSlug } from '@/utils/animeSlug'
import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

interface SearchModalProps {
	isOpen: boolean
	onClose: () => void
}

function normalize(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^а-яёa-z0-9]/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function searchInList(anime: Anime[], query: string): Anime[] {
	const q = normalize(query)
	if (q.length < 2) return []
	return anime
		.filter(
			item =>
				normalize(item.title_ru).includes(q) ||
				normalize(item.title_en).includes(q),
		)
		.slice(0, 10)
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
	const [query, setQuery] = useState('')
	const [apiResults, setApiResults] = useState<Anime[]>([])
	const [isApiLoading, setIsApiLoading] = useState(false)
	const { anime: cachedAnime } = useAnimeCache()
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const cacheResults = useMemo(
		() => searchInList(cachedAnime, query),
		[cachedAnime, query],
	)

	const showResults = normalize(query).length >= 2
	const results = cachedAnime.length > 0 ? cacheResults : apiResults
	const isLoading = isApiLoading && cachedAnime.length === 0

	// API fallback when cache is still empty
	useEffect(() => {
		if (cachedAnime.length > 0) return
		if (!showResults) {
			setApiResults([])
			return
		}

		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(async () => {
			setIsApiLoading(true)
			try {
				const res = await getCatalog({
					search: query.trim(),
					limit: '10',
					page: '1',
				})
				setApiResults(res.data.slice(0, 10))
			} finally {
				setIsApiLoading(false)
			}
		}, 350)

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [cachedAnime.length, query, showResults])

	// Reset state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setQuery('')
			setApiResults([])
		}
	}, [isOpen])

	// Escape key + body scroll lock
	useEffect(() => {
		function onEscapeKey(event: KeyboardEvent) {
			if (event.key === 'Escape') onClose()
		}
		if (isOpen) {
			document.addEventListener('keydown', onEscapeKey)
			document.body.style.overflow = 'hidden'
		}
		return () => {
			document.removeEventListener('keydown', onEscapeKey)
			document.body.style.overflow = ''
		}
	}, [isOpen, onClose])

	if (!isOpen) return null

	return (
		<div className='fixed inset-0 z-50 bg-aw-surface animate-slideUpFade'>
			<div className='mx-auto max-w-345 px-4 pt-6'>
				<div className='flex items-center justify-between'>
					<h2 className='text-xl font-semibold text-aw-text'>Поиск</h2>
					<button
						onClick={onClose}
						className='inline-flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-aw-subtle transition-colors hover:bg-aw-elevated hover:text-aw-text cursor-pointer'
						aria-label='Закрыть поиск'
					>
						<X size={24} aria-hidden='true' />
					</button>
				</div>

				<div className='relative mt-6'>
					<Search
						size={22}
						className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-aw-subtle'
						aria-hidden='true'
					/>
					<input
						type='text'
						autoFocus
						value={query}
						onChange={e => setQuery(e.target.value)}
						className='w-full rounded-xl border border-aw-border bg-aw-header py-4 pl-12 pr-10 text-lg text-aw-text placeholder:text-aw-subtle focus:border-aw-accent focus:outline-none focus:ring-2 focus:ring-aw-accent/20'
						placeholder='Начните вводить название аниме'
					/>
					{query && (
						<button
							onClick={() => setQuery('')}
							className='absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-aw-subtle hover:text-aw-text'
							aria-label='Очистить'
						>
							<X size={18} aria-hidden='true' />
						</button>
					)}
				</div>

				{showResults && (
					<div className='mt-3 overflow-hidden rounded-xl border border-aw-border bg-aw-bg'>
						{isLoading ? (
							<p className='py-5 text-center text-sm text-aw-subtle'>
								Поиск...
							</p>
						) : results.length === 0 ? (
							<p className='py-5 text-center text-sm text-aw-subtle'>
								Ничего не найдено
							</p>
						) : (
							<ul className='max-h-[60vh] divide-y divide-aw-border overflow-y-auto'>
								{results.map(anime => {
									const slug = createAnimeSlug(
										anime.id,
										anime.title_en || anime.title_ru,
									)
									return (
										<li key={anime.id}>
											<Link
												to={`/anime/${slug}`}
												onClick={onClose}
												className='flex items-center gap-3 px-4 py-3 no-underline hover:bg-aw-elevated'
											>
												<div className='relative h-16 w-12 shrink-0 overflow-hidden rounded bg-aw-elevated'>
													{anime.poster_url ? (
														<img
															src={anime.poster_url}
															alt=''
															className='h-full w-full object-cover'
															loading='lazy'
														/>
													) : (
														<span className='flex h-full items-center justify-center text-xs font-bold text-aw-subtle'>
															{(
																anime.title_en || anime.title_ru
															)
																.slice(0, 2)
																.toUpperCase()}
														</span>
													)}
												</div>
												<div className='min-w-0 flex-1'>
													<p className='m-0 truncate font-medium leading-snug text-aw-text'>
														{anime.title_ru || anime.title_en}
													</p>
													{anime.title_en &&
														anime.title_en !== anime.title_ru && (
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
								})}
							</ul>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
