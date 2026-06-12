import { getBulkCatalog } from '@/api/catalogApi'
import type { Anime } from '@/types/anime'
import { useEffect, useState } from 'react'

// Module-level cache: one /anime/bulk request per JS session.
let cachedAnime: Anime[] = []
let cacheTotal = 0
let cacheComplete = false
let cacheError: string | undefined
let cachePromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
	listeners.forEach(fn => fn())
}

export type AnimeCacheInfo = {
	anime: Anime[]
	total: number
	isComplete: boolean
	isLoading: boolean
	error?: string
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
		ensureAnimeCache()
	}, [])

	return {
		anime: cachedAnime,
		total: cacheTotal,
		isComplete: cacheComplete,
		isLoading: Boolean(cachePromise),
		error: cacheError,
	}
}

function ensureAnimeCache() {
	if (cacheComplete || cachePromise) return

	cacheError = undefined
	cachePromise = loadAnimeCache().finally(() => {
		cachePromise = null
		notify()
	})
	notify()
}

async function loadAnimeCache() {
	try {
		const bulk = await getBulkCatalog()
		if (bulk.data.length === 0) {
			throw new Error('Bulk catalog returned empty data')
		}
		cachedAnime = bulk.data
		cacheTotal = bulk.total || bulk.data.length
		cacheComplete = true
		cacheError = undefined
	} catch (err) {
		console.warn('Bulk catalog load failed:', err)
		cacheComplete = false
		cacheError = 'Не удалось загрузить каталог'
	}
}
