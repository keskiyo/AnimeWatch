import { getCatalog } from '@/api/catalogApi'
import { useAnimeCache } from '@/features/catalog/hooks/useAnimeCache'
import type { Anime } from '@/types/anime'
import { useEffect, useMemo, useRef, useState } from 'react'

export const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 12
const DEBOUNCE_MS = 300

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

/**
 * Anime search: instant preview from the client cache + debounced backend
 * search (the cache is partial, so the API stays the source of truth).
 */
export function useAnimeSearch(query: string) {
	const [apiResults, setApiResults] = useState<Anime[]>([])
	const [isApiLoading, setIsApiLoading] = useState(false)
	const { anime: cachedAnime } = useAnimeCache()
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const requestIdRef = useRef(0)

	const trimmedQuery = query.trim()
	const showResults = normalize(trimmedQuery).length >= MIN_QUERY_LENGTH

	const cacheResults = useMemo(
		() => searchInCache(cachedAnime, trimmedQuery),
		[cachedAnime, trimmedQuery],
	)

	// API results first (more complete via Shikimori), then cache extras
	const results = useMemo(
		() => mergeResults(apiResults, cacheResults),
		[apiResults, cacheResults],
	)

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
		}, DEBOUNCE_MS)

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [trimmedQuery, showResults])

	const reset = () => {
		setApiResults([])
		setIsApiLoading(false)
	}

	return { results, showResults, isApiLoading, reset }
}
