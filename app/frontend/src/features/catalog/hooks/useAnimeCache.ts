import { getBulkCatalog } from '@/api/catalogApi'
import type { Anime } from '@/types/anime'
import { useEffect } from 'react'
import { create } from 'zustand'

export type AnimeCacheInfo = {
	anime: Anime[]
	total: number
	isComplete: boolean
	isLoading: boolean
	error?: string
}

type AnimeCacheState = AnimeCacheInfo & { ensure: () => void }

// One /anime/bulk request per JS session, shared by every page.
const useAnimeCacheStore = create<AnimeCacheState>()((set, get) => ({
	anime: [],
	total: 0,
	isComplete: false,
	isLoading: false,
	error: undefined,
	ensure() {
		if (get().isComplete || cachePromise) return
		set({ isLoading: true, error: undefined })
		cachePromise = loadAnimeCache(set).finally(() => {
			cachePromise = null
		})
	},
}))

// Dedup guard kept outside reactive state (it's not used for rendering).
let cachePromise: Promise<void> | null = null

async function loadAnimeCache(
	set: (partial: Partial<AnimeCacheState>) => void,
): Promise<void> {
	try {
		const bulk = await getBulkCatalog()
		if (bulk.data.length === 0) {
			throw new Error('Bulk catalog returned empty data')
		}
		set({
			anime: bulk.data,
			total: bulk.total || bulk.data.length,
			isComplete: true,
			isLoading: false,
			error: undefined,
		})
	} catch (err) {
		console.warn('Bulk catalog load failed:', err)
		set({ isComplete: false, isLoading: false, error: 'Не удалось загрузить каталог' })
	}
}

export function useAnimeCache(): AnimeCacheInfo {
	const { anime, total, isComplete, isLoading, error, ensure } =
		useAnimeCacheStore()

	useEffect(() => {
		ensure()
	}, [ensure])

	return { anime, total, isComplete, isLoading, error }
}
