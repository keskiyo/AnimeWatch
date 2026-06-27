import { create } from 'zustand'

type ProgressState = {
	/** Number of in-flight things (API requests + a route-change pulse). */
	active: number
	inc: () => void
	dec: () => void
}

export const useProgressStore = create<ProgressState>(set => ({
	active: 0,
	inc: () => set(s => ({ active: s.active + 1 })),
	dec: () => set(s => ({ active: Math.max(0, s.active - 1) })),
}))

/** Imperative helpers for non-React code (axios interceptors, route pulse). */
export const progress = {
	inc: () => useProgressStore.getState().inc(),
	dec: () => useProgressStore.getState().dec(),
	/** Brief pulse so even instant (cached/prefetched) navigations show the bar. */
	pulse: (ms = 400) => {
		useProgressStore.getState().inc()
		setTimeout(() => useProgressStore.getState().dec(), ms)
	},
}
