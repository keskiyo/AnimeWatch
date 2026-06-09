import type { Anime, KodikPlayer, RelatedAnime } from '@/types/anime'

export type AnimeInfoRow = {
	label: string
	value: string
	tone?: 'default' | 'accent' | 'badge'
}

export type AnimeFrame = {
	id: string
	label: string
	gradient: string
	imageUrl?: string
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

export type AnimePageData = {
	anime: Anime
	fullTitle: string
	description: string[]
	nextEpisode: string
	infoRows: AnimeInfoRow[]
	frames: AnimeFrame[]
	relatedAnime: RelatedAnime[]
	playerTitle: string
	playerGradient: string
	player?: KodikPlayer
	playerTracks: AnimePlayerTrack[]
	playerEpisodes: AnimePlayerEpisode[]
	activeEpisodeTitle: string
	activeEpisodeDate: string
	scheduleRows: AnimeScheduleRow[]
}
