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

const STORAGE_KEY = 'aw:catalog:v4'

type Persisted = { ts: number; total: number; anime: Anime[] }

function readPersisted(): Persisted | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		const parsed = raw ? (JSON.parse(raw) as Persisted) : null
		return parsed?.anime?.length ? parsed : null
	} catch {
		return null
	}
}

function writePersisted(anime: Anime[], total: number): void {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ts: Date.now(), total, anime } satisfies Persisted),
		)
	} catch {
		// quota / private mode — caching is best-effort, ignore
	}
}

// One /anime/bulk request per JS session, shared by every page.
const useAnimeCacheStore = create<AnimeCacheState>()((set, get) => ({
	anime: [],
	total: 0,
	isComplete: false,
	isLoading: false,
	error: undefined,
	ensure() {
		if (get().isComplete || cachePromise) return

		const cached = readPersisted()
		if (cached) {
			// Render persisted catalog instantly, then revalidate so a completed
			// backend sync is reflected without waiting for localStorage expiry.
			set({
				anime: cached.anime,
				total: cached.total || cached.anime.length,
				isComplete: true,
				isLoading: false,
				error: undefined,
			})
		} else {
			set({ isLoading: true, error: undefined })
		}

		// Revalidate (or first load) in the background.
		cachePromise = loadAnimeCache(set, Boolean(cached)).finally(() => {
			cachePromise = null
		})
	},
}))

// Dedup guard kept outside reactive state (it's not used for rendering).
let cachePromise: Promise<void> | null = null

async function loadAnimeCache(
	set: (partial: Partial<AnimeCacheState>) => void,
	hasCache: boolean,
): Promise<void> {
	try {
		const bulk = await getBulkCatalog()
		if (bulk.data.length === 0) {
			throw new Error('Bulk catalog returned empty data')
		}
		writePersisted(bulk.data, bulk.total || bulk.data.length)
		set({
			anime: bulk.data,
			total: bulk.total || bulk.data.length,
			isComplete: true,
			isLoading: false,
			error: undefined,
		})
	} catch (err) {
		console.warn('Bulk catalog load failed:', err)
		// Keep showing the persisted copy on failure; only surface an error when
		// we had nothing to show.
		if (!hasCache) {
			set({
				isComplete: false,
				isLoading: false,
				error: 'Не удалось загрузить каталог',
			})
		}
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
