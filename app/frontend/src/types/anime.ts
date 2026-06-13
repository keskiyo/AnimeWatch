export type AnimeType = 'tv' | 'ova' | 'movie' | 'ona' | 'special'
export type AnimeStatus = 'ongoing' | 'released' | 'announced'
export type AnimeSeason = 'winter' | 'spring' | 'summer' | 'fall'
export type PlayerName = 'kodik'
export type WatchlistStatus =
	| 'watching'
	| 'plan_to_watch'
	| 'completed'
	| 'on_hold'
	| 'dropped'

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
	age_rating?: string
	next_episode_at?: string | null // ISO date of the next episode air time (ongoings only)
	rating_mpaa?: string // "g" | "pg" | "pg_13" | "r" | "r17" | "rx"
	duration?: number // episode duration in minutes
	source?: string // "manga" | "light_novel" | "original" | …
	directors?: Array<{ name: string; url: string }>
	authors?: Array<{ name: string; url: string }>
	characters?: Array<{ name: string; url: string }>
	screenshots?: string[] // Shikimori screenshots (detail page only)
}

export type Episode = {
	id: string
	anime_id: number
	episode_number: number
	title?: string | null
	release_date_jp?: string | null
	release_date_dub?: string | null
	duration?: number
	players: {
		kodik?: { url: string; quality: string[] }
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
	user_id?: number
	anime_id: number
	added_at: string
	status: WatchlistStatus
	favorite?: boolean
	notifications_enabled?: boolean
	last_watched_episode?: number
	anime?: Anime
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

export type KodikTranslation = {
	id: string
	title: string
	link: string
	episodes_count: number
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
			episode_titles?: Record<string, string>
			translations?: KodikTranslation[]
	  }
	| {
			available: false
			provider: 'kodik'
			message: string
	  }

type ScheduleItem = {
	anime: Anime
	episode: number
	time: string
	studio?: string
}

export type ScheduleResponse = Record<string, ScheduleItem[]>
