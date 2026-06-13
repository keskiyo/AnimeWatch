import type { Anime, KodikPlayer, RelatedAnime } from '@/types/anime'

export type AnimeInfoLink = {
	label: string
	href: string
}

export type AnimeInfoRow = {
	label: string
	value: string
	tone?: 'default' | 'accent' | 'badge'
	links?: AnimeInfoLink[]
}

export type AnimeFrame = {
	id: string
	label: string
	gradient: string
	imageUrl?: string
}

export type PlayerProviderId = 'kodik'

export type AnimePlayerTrack = {
	id: string
	label: string
	isActive?: boolean
	isMuted?: boolean
	/** Kodik player link for this specific translation. */
	link?: string
	episodesCount?: number
}

export type AnimePlayerEpisode = {
	number: number
	isActive?: boolean
	title?: string | null
}

export type AnimeScheduleRow = {
	episode: string
	title: string
	releaseDate: string
	status: 'released' | 'soon'
}

export type PlayerProvider = {
	id: PlayerProviderId
	label: string
}

export type AnimePlayerProps = {
	title: string
	background: string
	tracks: AnimePlayerTrack[]
	episodes: AnimePlayerEpisode[]
	player?: KodikPlayer
	activeEpisodeTitle: string
	activeEpisodeDate: string
	ageRating?: string | number | null
	providers?: PlayerProvider[]
	activeTrackId?: string
	activeProviderId?: string
	onTrackChange?: (trackId: string) => void
	onProviderChange?: (providerId: string) => void
}

export type AnimePlayerSidebarProps = {
	tracks: AnimePlayerTrack[]
	providers: PlayerProvider[]
	hasEpisodes: boolean
	activeTrackId?: string
	activeProviderId?: string
	onTrackChange?: (trackId: string) => void
	onProviderChange?: (providerId: string) => void
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
	ageRating?: string | number | null
	playerProviders?: PlayerProvider[]
}
