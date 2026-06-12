import { getAnimegoStream, getAnimegoVoices } from '@/api/playerApi'
import type {
	AnimegoVoice,
	AnimePlayerTrack,
	StreamSource,
} from '@/types/animePage'
import { useEffect, useRef, useState } from 'react'

/** Backup-player state: AnimeGO voices per episode + the active stream. */
export function useAnimegoPlayer(
	animeId: number,
	episode: number | undefined,
	enabled: boolean,
) {
	const [voices, setVoices] = useState<AnimegoVoice[]>([])
	const [episodesCount, setEpisodesCount] = useState(0)
	const [activeVoiceId, setActiveVoiceId] = useState<string | undefined>()
	const [stream, setStream] = useState<StreamSource | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	// Keep the chosen dubbing across episode switches (matched by title)
	const lastVoiceTitleRef = useRef<string | null>(null)

	useEffect(() => {
		if (!enabled || !episode || animeId <= 0) return
		let cancelled = false
		setIsLoading(true)

		getAnimegoVoices(animeId, episode)
			.then(result => {
				if (cancelled) return
				if (!result.available) {
					setVoices([])
					setActiveVoiceId(undefined)
					return
				}
				setVoices(result.voices)
				if (result.episodes_count > 0) {
					setEpisodesCount(result.episodes_count)
				}
				const sameVoice = result.voices.find(
					v => v.title === lastVoiceTitleRef.current,
				)
				setActiveVoiceId((sameVoice ?? result.voices[0])?.id)
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [enabled, animeId, episode])

	// Fetch the stream whenever the active voice (or episode) changes
	useEffect(() => {
		if (!enabled || !episode || !activeVoiceId) {
			setStream(null)
			return
		}
		const voice = voices.find(v => v.id === activeVoiceId)
		if (!voice) return
		let cancelled = false
		setStream(null) // show the loading state while switching

		getAnimegoStream(animeId, episode, voice.stream_ref, voice.player_type)
			.then(source => {
				if (!cancelled) setStream(source)
			})
			.catch(() => {
				if (!cancelled) setStream({ kind: 'unsupported' })
			})

		return () => {
			cancelled = true
		}
	}, [enabled, animeId, episode, activeVoiceId, voices])

	function selectVoice(voiceId: string) {
		const voice = voices.find(v => v.id === voiceId)
		if (voice) lastVoiceTitleRef.current = voice.title
		setActiveVoiceId(voiceId)
	}

	// AnimeGO voices in the shared track shape for AnimePlayerSidebar
	const tracks: AnimePlayerTrack[] = voices.map(voice => ({
		id: voice.id,
		label:
			voice.player_type === 'cvh'
				? voice.title
				: `${voice.title} (aniboom)`,
		provider: 'animego',
		playerType: voice.player_type,
		streamRef: voice.stream_ref,
	}))

	return { tracks, episodesCount, activeVoiceId, selectVoice, stream, isLoading }
}
