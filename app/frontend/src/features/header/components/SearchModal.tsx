import { getCatalog } from '@/api/animeApi'
import { useAnimeCache } from '@/features/catalog/hooks/useAnimeCache'
import type { Anime } from '@/types/anime'
import { formatAnimeType } from '@/utils/animePageFormatters'
import { formatAnimeRating, getAnimeRatingColor } from '@/utils/animeRating'
import { createAnimeSlug } from '@/utils/animeSlug'
import { proxyImage } from '@/utils/imageProxy'
import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

interface SearchModalProps {
	isOpen: boolean
	onClose: () => void
}

const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 12

function normalize(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^а-яёa-z0-9]/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function searchInCache(anime: Anime[], query: string): Anime[] {
	const q = normalize(query)
	if (q.length < MIN_QUERY_LENGTH) return []
	return anime.filter(
		item =>
			normalize(item.title_ru).includes(q) ||
			normalize(item.title_en).includes(q),
	)
}

function mergeResults(primary: Anime[], secondary: Anime[]): Anime[] {
	const seen = new Set<number>()
	const merged: Anime[] = []
	for (const item of [...primary, ...secondary]) {
		if (seen.has(item.id)) continue
		seen.add(item.id)
		merged.push(item)
		if (merged.length >= MAX_RESULTS) break
	}
	return merged
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
	const [query, setQuery] = useState('')
	const [apiResults, setApiResults] = useState<Anime[]>([])
	const [isApiLoading, setIsApiLoading] = useState(false)
	const { anime: cachedAnime } = useAnimeCache()
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const requestIdRef = useRef(0)

	const trimmedQuery = query.trim()
	const showResults = normalize(trimmedQuery).length >= MIN_QUERY_LENGTH

	// Instant client-side preview from the (partial) cache
	const cacheResults = useMemo(
		() => searchInCache(cachedAnime, trimmedQuery),
		[cachedAnime, trimmedQuery],
	)

	// Show API results first (more complete via Shikimori), then cache extras
	const results = useMemo(
		() => mergeResults(apiResults, cacheResults),
		[apiResults, cacheResults],
	)

	// Always query the backend search (debounced) — the cache only holds a
	// partial set, so it can't be the source of truth for search.
	useEffect(() => {
		if (!showResults) {
			setApiResults([])
			setIsApiLoading(false)
			return
		}

		setIsApiLoading(true)
		if (debounceRef.current) clearTimeout(debounceRef.current)

		const requestId = ++requestIdRef.current
		debounceRef.current = setTimeout(async () => {
			try {
				const res = await getCatalog({
					search: trimmedQuery,
					limit: String(MAX_RESULTS),
					page: '1',
				})
				if (requestId === requestIdRef.current) {
					setApiResults(res.data.slice(0, MAX_RESULTS))
				}
			} finally {
				if (requestId === requestIdRef.current) {
					setIsApiLoading(false)
				}
			}
		}, 300)

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [trimmedQuery, showResults])

	// Reset state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setQuery('')
			setApiResults([])
			setIsApiLoading(false)
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

	const isLoading = isApiLoading && results.length === 0

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
															src={proxyImage(anime.poster_url)}
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
