import type { Anime, KodikPlayer } from '@/types/anime'

export type AnimeInfoRow = {
	label: string
	value: string
	tone?: 'default' | 'accent' | 'badge'
}

export type AnimeFrame = {
	id: string
	label: string
	gradient: string
}

export type AnimePlayerTrack = {
	id: string
	label: string
	isActive?: boolean
	isMuted?: boolean
}

export type AnimePlayerEpisode = {
	number: number
	isActive?: boolean
}

export type AnimeScheduleRow = {
	episode: string
	title: string
	releaseDate: string
	status: 'released' | 'soon'
}

export type PlayerProvider = {
	id: string
	label: string
}

export type AnimePageData = {
	anime: Anime
	fullTitle: string
	description: string[]
	nextEpisode: string
	infoRows: AnimeInfoRow[]
	frames: AnimeFrame[]
	playerTitle: string
	playerGradient: string
	player?: KodikPlayer
	playerTracks: AnimePlayerTrack[]
	playerEpisodes: AnimePlayerEpisode[]
	activeEpisodeTitle: string
	activeEpisodeDate: string
	scheduleRows: AnimeScheduleRow[]
	ageRating?: string | number | null
	playerProviders?: PlayerProvider[]
}
