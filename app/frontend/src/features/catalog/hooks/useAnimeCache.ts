import { getCatalog } from '@/api/animeApi'
import type { Anime } from '@/types/anime'
import { useEffect, useState } from 'react'

// Module-level cache — persists for the lifetime of the page session
let cachedAnime: Anime[] = []
let cacheTotal = 0
let cacheComplete = false
let cacheStarted = false
const listeners = new Set<() => void>()

function notify() {
	listeners.forEach(fn => fn())
}

export type AnimeCacheInfo = {
	anime: Anime[]
	total: number
	isComplete: boolean
	isLoading: boolean
}

export function useAnimeCache(): AnimeCacheInfo {
	const [, tick] = useState(0)

	useEffect(() => {
		const fn = () => tick(n => n + 1)
		listeners.add(fn)
		return () => {
			listeners.delete(fn)
		}
	}, [])

	useEffect(() => {
		if (!cacheStarted) {
			cacheStarted = true
			void loadAllAnime()
		}
	}, [])

	return {
		anime: cachedAnime,
		total: cacheTotal,
		isComplete: cacheComplete,
		isLoading: cacheStarted && !cacheComplete,
	}
}

async function loadAllAnime() {
	const LIMIT = 100

	try {
		// First page — establishes total count
		const first = await getCatalog({
			page: '1',
			limit: String(LIMIT),
			sort: 'startDate',
			direction: 'desc',
		})

		if (first.data.length === 0) {
			cacheComplete = true
			notify()
			return
		}

		cachedAnime = [...first.data]
		cacheTotal = first.total
		notify()

		const actualPageSize = first.data.length
		const totalPages = Math.ceil(first.total / actualPageSize)

		if (totalPages <= 1) {
			cacheComplete = true
			notify()
			return
		}

		// Load remaining pages in parallel batches of 8
		const BATCH = 8
		for (let p = 2; p <= totalPages; p += BATCH) {
			const pages = Array.from(
				{ length: Math.min(BATCH, totalPages - p + 1) },
				(_, i) => p + i,
			)

			const results = await Promise.all(
				pages.map(pg =>
					getCatalog({
						page: String(pg),
						limit: String(LIMIT),
						sort: 'startDate',
						direction: 'desc',
					}),
				),
			)

			let added = 0
			for (const r of results) {
				added += r.data.length
				cachedAnime = [...cachedAnime, ...r.data]
			}

			notify()
			if (added === 0) break
		}
	} catch (err) {
		console.warn('Cache load failed:', err)
	}

	cacheComplete = true
	notify()
}
