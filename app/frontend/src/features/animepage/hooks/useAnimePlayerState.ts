import type { KodikPlayer } from '@/types/anime'
import type { AnimePlayerTrack, PlayerProvider } from '@/types/animePage'
import { buildKodikEpisodeLink } from '@/utils/kodikLink'
import { useEffect, useMemo, useState } from 'react'

type UseAnimePlayerStateArgs = {
	player?: KodikPlayer
	tracks: AnimePlayerTrack[]
	providers: PlayerProvider[]
	activeTrackId?: string
	activeEpisodeTitle: string
	onTrackChange?: (trackId: string) => void
}

/**
 * Player page state: active episode, dubbing tracks available for it,
 * effective provider list and the final iframe src.
 */
export function useAnimePlayerState({
	player,
	tracks,
	providers,
	activeTrackId,
	activeEpisodeTitle,
	onTrackChange,
}: UseAnimePlayerStateArgs) {
	// Max episode count across all dubbing tracks (teams differ in progress)
	const availableEpisodesCount = useMemo(() => {
		if (!player?.available) return 0
		const max = Math.max(
			player.episodes_count,
			...tracks.map(t => t.episodesCount ?? 0),
		)
		return max > 0 ? max : 0
	}, [player, tracks])

	const [activeEpisode, setActiveEpisode] = useState<number | undefined>(
		availableEpisodesCount > 0 ? 1 : undefined,
	)

	useEffect(() => {
		if (availableEpisodesCount <= 0) {
			setActiveEpisode(undefined)
			return
		}

		setActiveEpisode(prev =>
			prev && prev <= availableEpisodesCount ? prev : 1,
		)
	}, [availableEpisodesCount])

	// A track can play the episode if it voiced at least that many episodes.
	// Tracks without a known count are kept (movies, single links).
	const visibleTracks = tracks.filter(
		track =>
			!track.isMuted &&
			(!activeEpisode ||
				!track.episodesCount ||
				track.episodesCount <= 0 ||
				track.episodesCount >= activeEpisode),
	)

	// Keep the chosen dubbing when switching episodes; if the team hasn't
	// voiced the new episode yet — fall back to the first available one.
	useEffect(() => {
		const firstVisible = visibleTracks[0]
		if (!firstVisible) return
		if (!visibleTracks.some(t => t.id === activeTrackId)) {
			onTrackChange?.(firstVisible.id)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeEpisode, visibleTracks.length, activeTrackId])

	// Kodik must stay the active player whenever it is available — never show
	// the empty state if there is a real player source.
	const effectiveProviders: PlayerProvider[] =
		providers.length > 0
			? providers
			: player?.available
				? [{ id: 'kodik', label: 'Kodik' }]
				: []

	// iframe src = link of the active dubbing track + selected episode
	const activeTrack =
		tracks.find(t => t.id === activeTrackId) ?? visibleTracks[0]
	const playerSrc = player?.available
		? buildKodikEpisodeLink(activeTrack?.link ?? player.link, activeEpisode)
		: ''

	const normalizedTitle = activeEpisodeTitle.trim() || null
	const currentEpisodeTitle =
		!player?.available || activeEpisode === undefined
			? (normalizedTitle ?? 'Неизвестно')
			: (player.episode_titles?.[activeEpisode] ??
				player.episode_titles?.[activeEpisode - 1] ??
				normalizedTitle ??
				`Серия ${activeEpisode}`)

	return {
		availableEpisodesCount,
		activeEpisode,
		setActiveEpisode,
		visibleTracks,
		effectiveProviders,
		playerSrc,
		currentEpisodeTitle,
	}
}
