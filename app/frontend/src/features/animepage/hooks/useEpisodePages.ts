import type { AnimePlayerEpisode } from '@/types/animePage'
import { useEffect, useMemo, useState } from 'react'

export const VISIBLE_EPISODES = 8

type UseEpisodePagesArgs = {
	episodes: AnimePlayerEpisode[]
	activeEpisode?: number
	availableEpisodesCount?: number | null
}

export function useEpisodePages({
	episodes,
	activeEpisode,
	availableEpisodesCount,
}: UseEpisodePagesArgs) {
	const displayEpisodes = useMemo(() => {
		if (availableEpisodesCount == null) return episodes
		if (availableEpisodesCount <= 0) return []
		return episodes.slice(0, availableEpisodesCount)
	}, [episodes, availableEpisodesCount])

	const activeIndex = displayEpisodes.findIndex(ep =>
		activeEpisode !== undefined ? ep.number === activeEpisode : ep.isActive,
	)
	const normalizedActiveIndex = activeIndex >= 0 ? activeIndex : 0
	const pages = useMemo(() => {
		const result: AnimePlayerEpisode[][] = []
		for (let i = 0; i < displayEpisodes.length; i += VISIBLE_EPISODES) {
			const isLastShortPage =
				i > 0 && displayEpisodes.length - i < VISIBLE_EPISODES
			const start = isLastShortPage
				? Math.max(displayEpisodes.length - VISIBLE_EPISODES, 0)
				: i
			const pageEpisodes = displayEpisodes.slice(
				start,
				start + VISIBLE_EPISODES,
			)
			const previousPage = result.at(-1)
			if (previousPage?.[0]?.number === pageEpisodes[0]?.number) continue
			result.push(pageEpisodes)
		}
		return result
	}, [displayEpisodes])
	const [page, setPage] = useState(0)

	useEffect(() => {
		if (displayEpisodes.length === 0) {
			setPage(0)
			return
		}

		const activePage = Math.floor(normalizedActiveIndex / VISIBLE_EPISODES)
		setPage(prevPage => {
			const start = prevPage * VISIBLE_EPISODES
			const activeIsVisible =
				normalizedActiveIndex >= start &&
				normalizedActiveIndex < start + VISIBLE_EPISODES
			return activeIsVisible ? prevPage : activePage
		})
	}, [normalizedActiveIndex, displayEpisodes.length])

	return {
		displayEpisodes,
		pages,
		page,
		isPrevDisabled: page <= 0,
		isNextDisabled: page >= pages.length - 1,
		handlePrev: () => setPage(prev => Math.max(0, prev - 1)),
		handleNext: () => setPage(prev => Math.min(pages.length - 1, prev + 1)),
	}
}
