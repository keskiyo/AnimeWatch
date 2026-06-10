import { getBulkCatalog, getCatalog } from '@/api/catalogApi'
import type { Anime } from '@/types/anime'
import { useEffect, useState } from 'react'

// Module-level cache — persists for the JS session (cleared on full page reload,
// but the BACKEND caches for 24 h in SQLite so the reload is always fast).
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
			void loadAnimeCache()
		}
	}, [])

	return {
		anime: cachedAnime,
		total: cacheTotal,
		isComplete: cacheComplete,
		isLoading: cacheStarted && !cacheComplete,
	}
}

async function loadAnimeCache() {
	// Step 1 — load 12 ongoings immediately for instant first render
	try {
		const initial = await getCatalog({
			status: 'ongoing',
			limit: '12',
			page: '1',
			sort: 'startDate',
			direction: 'desc',
		})
		if (initial.data.length > 0) {
			const seenIds = new Set(initial.data.map(a => a.id))
			cachedAnime = [...initial.data]
			cacheTotal = 0
			notify()

			// Step 2 — load full bulk catalog from backend (SQLite-cached 24 h)
			// This single request replaces the old N-page pagination loop.
			try {
				const bulk = await getBulkCatalog()
				// Merge: bulk result is authoritative; prepend any ongoings not in it
				const bulkIds = new Set(bulk.data.map(a => a.id))
				const ongoingExtras = initial.data.filter(a => !bulkIds.has(a.id))
				cachedAnime = [...ongoingExtras, ...bulk.data]
				cacheTotal = cachedAnime.length
			} catch (bulkErr) {
				console.warn('Bulk catalog failed, keeping initial ongoings:', bulkErr)
				// Fall back to paginated load if bulk endpoint unavailable
				await loadPaginated(seenIds)
			}
		} else {
			// No ongoings — go straight to bulk
			await loadBulkOrPaginated()
		}
	} catch (err) {
		console.warn('Initial ongoings load failed:', err)
		await loadBulkOrPaginated()
	}

	cacheComplete = true
	notify()
}

async function loadBulkOrPaginated() {
	try {
		const bulk = await getBulkCatalog()
		cachedAnime = bulk.data
		cacheTotal = bulk.total
	} catch {
		// Absolute fallback: old paginated approach
		await loadPaginated(new Set())
	}
}

// Legacy paginated fallback (used only if /anime/bulk is unavailable)
async function loadPaginated(seenIds: Set<number>) {
	const LIMIT = 50
	const BATCH = 8
	const MAX_PAGES = 80

	function fetchPage(page: number) {
		return getCatalog({
			page: String(page),
			limit: String(LIMIT),
			sort: 'startDate',
			direction: 'desc',
		})
	}

	function append(items: Anime[]): number {
		let added = 0
		for (const item of items) {
			if (seenIds.has(item.id)) continue
			seenIds.add(item.id)
			cachedAnime = [...cachedAnime, item]
			added++
		}
		return added
	}

	try {
		const first = await fetchPage(1)
		if (first.data.length === 0) return

		const pageSize = first.data.length
		append(first.data)
		notify()

		if (first.data.length < LIMIT) return

		let reachedEnd = false
		for (let p = 2; p <= MAX_PAGES && !reachedEnd; p += BATCH) {
			const pages = Array.from(
				{ length: Math.min(BATCH, MAX_PAGES - p + 1) },
				(_, i) => p + i,
			)
			const results = await Promise.all(pages.map(fetchPage))

			let added = 0
			for (const r of results) {
				added += append(r.data)
				if (r.data.length < pageSize) reachedEnd = true
			}
			notify()
			if (added === 0) break
		}
	} catch (err) {
		console.warn('Paginated fallback failed:', err)
	}
}
