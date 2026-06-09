export type AnimeType = 'tv' | 'ova' | 'movie' | 'ona' | 'special'
export type AnimeStatus = 'ongoing' | 'released' | 'announced'
export type AnimeSeason = 'winter' | 'spring' | 'summer' | 'fall'
export type PlayerName = 'kodik' | 'aniboom'
export type WatchlistStatus = 'watching' | 'planned' | 'completed' | 'dropped'

export type Anime = {
	id: number
	mal_id?: number
	anilist_id?: number
	title_ru: string
	title_en: string
	title_jp: string
	poster_url: string
	description: string
	genres: string[]
	studio: string
	type: AnimeType
	status: AnimeStatus
	year: number
	season?: AnimeSeason
	episodes_total: number
	episodes_aired: number
	rating: number
	score_count: number
	url_shikimori?: string
	url_anilist?: string
	updated_at: string
}

export type AnimeCardProps = {
	anime: Anime
	progress?: number
}

export type Episode = {
	id: string
	anime_id: number
	episode_number: number
	title?: string
	release_date_jp: string
	release_date_dub?: string
	duration?: number
	players: {
		kodik?: { url: string; quality: string[] }
		aniboom?: { url: string }
	}
	dubbing_studios: string[]
}

export type CatalogResult = {
	data: Anime[]
	total: number
	page: number
}

export type ScheduleEntry = {
	anime: Anime
	episode: number
	time: string
	studio: string
}

export type WatchlistEntry = {
	anime_id: number
	added_at: string
	status: WatchlistStatus
	favorite: boolean
	notifications_enabled: boolean
	last_watched_episode?: number
	anime?: Anime
}

export type AppSettings = {
	default_player: 'auto' | PlayerName
	default_quality: 'auto' | '360p' | '480p' | '720p' | '1080p'
	default_dubbing: 'auto' | 'AniLibria' | 'SovetRomantica' | 'AnimeVost'
	theme: 'dark'
	notifications_enabled: boolean
	cache_size_limit: number
}

export type RelatedAnime = {
	id: number
	relation: string
	title_ru: string
	title_en: string
	poster_url: string
	type: AnimeType
	year: number
	rating: number
}

export type AppNotification = {
	id: string
	anime_id: number
	episode_number: number
	title: string
	message: string
	created_at: string
	read: boolean
	type: 'episode_release' | 'anime_update'
}

export type KodikPlayer =
	| {
			available: true
			provider: 'kodik'
			link: string
			translation: string
			quality: string
			episodes_count: number
			screenshots: string[]
	  }
	| {
			available: false
			provider: 'kodik'
			message: string
	  }
