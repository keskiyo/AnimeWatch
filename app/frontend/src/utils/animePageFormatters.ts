import type { Anime, KodikPlayer } from '@/types/anime'

export function normalizeAnimeTitle(value: string): string {
	return value.replace(/\.\.\.$/, '').trim()
}

export function getNextEpisodeText(anime: Anime): string {
	if (anime.status !== 'ongoing') {
		return 'Расписание новых серий не активно'
	}

	if (anime.next_episode_at) {
		const formatted = formatScheduleDate(anime.next_episode_at)
		if (formatted !== 'Неизвестно') return formatted
	}

	return 'Ожидается обновление расписания'
}

/** Episodes available to watch: player count → aired → total (for released). */
export function getAvailableEpisodes(
	anime: Anime,
	player?: KodikPlayer,
): number {
	if (player?.available && player.episodes_count > 0) {
		return player.episodes_count
	}
	if (anime.episodes_aired > 0) return anime.episodes_aired
	// A finished show has all its episodes aired even if the API says 0
	if (anime.status === 'released' && anime.episodes_total > 0) {
		return anime.episodes_total
	}
	return 0
}

export function formatEpisodes(anime: Anime, player?: KodikPlayer): string {
	const aired = getAvailableEpisodes(anime, player)
	const total = anime.episodes_total > 0 ? anime.episodes_total : 0

	if (aired <= 0 && total <= 0) return 'Неизвестно'
	if (total <= 0) return `${aired} / ?`
	return `${aired} / ${total}`
}

/** Counter for the "Смотреть онлайн" button. Empty string = no data, hide it. */
export function formatWatchCounter(
	anime: Anime,
	player?: KodikPlayer,
): string {
	const available = getAvailableEpisodes(anime, player)
	const total = anime.episodes_total > 0 ? anime.episodes_total : 0

	if (available <= 0) return ''
	if (total <= 0) return String(available)
	return `${available} / ${total}`
}

export function formatAnimeType(value: string): string {
	const labels: Record<string, string> = {
		tv: 'TV',
		movie: 'Фильм',
		ova: 'OVA',
		ona: 'ONA',
		special: 'Спешл',
	}

	return labels[value] ?? value
}

export function formatSeason(anime: Anime): string {
	const labels: Record<string, string> = {
		winter: 'Зима',
		spring: 'Весна',
		summer: 'Лето',
		fall: 'Осень',
	}

	return anime.season ? `${labels[anime.season]} ${anime.year}` : String(anime.year)
}

export function formatStatus(value: string): string {
	const labels: Record<string, string> = {
		ongoing: 'Онгоинг',
		released: 'Вышел',
		announced: 'Анонс',
	}

	return labels[value] ?? value
}

export function createPlayerBackground(posterUrl: string): string {
	if (!posterUrl) {
		return 'linear-gradient(135deg,#27313a 0%,#718c82 42%,#e5d7aa 100%)'
	}

	return `linear-gradient(90deg,rgba(0,0,0,0.56),rgba(0,0,0,0.18)), url("${posterUrl}") center / cover`
}

export function getPositiveCount(value: number): number {
	return Number.isFinite(value) && value > 0 ? Math.round(value) : 0
}

// Shikimori rating_mpaa values: "g","pg","pg_13","r","r_plus","rx"
export function formatRatingMpaa(rating: string): string {
	const labels: Record<string, string> = {
		g: 'G',
		pg: 'PG',
		pg_13: 'PG-13',
		r: 'R-17',
		r_plus: 'R+',
		rx: 'RX',
	}
	return labels[rating] ?? rating.toUpperCase().replace('_', '-')
}

/** Age label for the player header. Accepts "16+", 16, mpaa strings ("pg-13"). */
export function formatPlayerAgeRating(
	rating?: string | number | null,
): string | null {
	if (rating == null) return null
	const r = String(rating).toLowerCase().trim()
	if (/^\d+\+$/.test(r)) return r
	if (/^\d+$/.test(r)) return `${r}+`
	const map: Record<string, string> = {
		g: '0+',
		pg: '7+',
		'pg-13': '13+',
		r: '17+',
		'r+': '18+',
		rx: '18+',
	}
	return map[r] ?? String(rating)
}

export function formatAgeRating(rating: string): string {
	const labels: Record<string, string> = {
		g: '0+',
		pg: '6+',
		pg_13: '13+',
		r: '17+',
		r_plus: '18+',
		rx: '18+',
	}
	return labels[rating] ?? ''
}

export function formatSource(source: string): string {
	const labels: Record<string, string> = {
		manga: 'Манга',
		light_novel: 'Лёгкий роман',
		novel: 'Новелла',
		visual_novel: 'Визуальная новелла',
		game: 'Игра',
		original: 'Оригинал',
		music: 'Музыка',
		other: 'Другое',
		'4_koma_manga': '4-кома манга',
		web_manga: 'Веб-манга',
		doujinshi: 'Додзинси',
		book: 'Книга',
		card_game: 'Карточная игра',
		picture_book: 'Детская книга',
		mixed_media: 'Смешанная',
		radio: 'Радио',
		web_novel: 'Веб-новелла',
	}
	return labels[source] ?? source
}

export function formatDuration(minutes: number): string {
	return `${minutes} мин. / серия`
}

export function formatScheduleDate(isoDate: string): string {
	try {
		const d = new Date(isoDate)
		if (Number.isNaN(d.getTime())) return 'Неизвестно'
		return d.toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		})
	} catch {
		return 'Неизвестно'
	}
}

export function stripBBCode(text: string): string {
	return text
		.replace(/\[\w+=[^\]]*\]([\s\S]*?)\[\/\w+\]/g, '$1')
		.replace(/\[\w+\]([\s\S]*?)\[\/\w+\]/g, '$1')
		.replace(/\[\/?\w+[^\]]*\]/g, '')
		.trim()
}
