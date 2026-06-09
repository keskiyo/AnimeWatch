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
	// The backend caps page size at 50 and returns a synthetic `total` that
	// only signals "is there a next page", not the real count. So we ignore
	// `total` entirely and paginate until a page comes back short/empty.
	const LIMIT = 50
	const BATCH = 8
	const MAX_PAGES = 60 // safety cap (~3000 titles) to avoid hammering Shikimori

	function fetchPage(page: number) {
		return getCatalog({
			page: String(page),
			limit: String(LIMIT),
			sort: 'startDate',
			direction: 'desc',
		})
	}

	const seenIds = new Set<number>()

	function append(items: Anime[]): number {
		let added = 0
		for (const item of items) {
			if (seenIds.has(item.id)) continue
			seenIds.add(item.id)
			cachedAnime = [...cachedAnime, item]
			added += 1
		}
		return added
	}

	try {
		const first = await fetchPage(1)
		if (first.data.length === 0) {
			cacheComplete = true
			notify()
			return
		}

		const pageSize = first.data.length
		append(first.data)
		cacheTotal = 0
		notify()

		// Short first page means there is nothing more to load
		if (first.data.length < LIMIT) {
			cacheComplete = true
			notify()
			return
		}

		let reachedEnd = false
		for (let p = 2; p <= MAX_PAGES && !reachedEnd; p += BATCH) {
			const pages = Array.from(
				{ length: Math.min(BATCH, MAX_PAGES - p + 1) },
				(_, i) => p + i,
			)

			const results = await Promise.all(pages.map(fetchPage))

			let batchAdded = 0
			for (const r of results) {
				batchAdded += append(r.data)
				// A page shorter than the requested size is the last page
				if (r.data.length < pageSize) reachedEnd = true
			}

			notify()
			if (batchAdded === 0) break
		}
	} catch (err) {
		console.warn('Cache load failed:', err)
	}

	cacheComplete = true
	notify()
}
