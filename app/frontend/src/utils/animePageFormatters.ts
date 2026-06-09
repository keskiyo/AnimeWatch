import type { Anime } from '@/types/anime'

export function normalizeAnimeTitle(value: string): string {
	return value.replace(/\.\.\.$/, '').trim()
}

export function getNextEpisodeText(anime: Anime): string {
	if (anime.status !== 'ongoing') {
		return 'Расписание новых серий не активно'
	}

	return 'Ожидается обновление расписания'
}

export function formatEpisodes(anime: Anime): string {
	const total = anime.episodes_total > 0 ? String(anime.episodes_total) : '?'
	return `${anime.episodes_aired} / ${total}`
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

export function formatRatingMpaa(rating: string): string {
	const labels: Record<string, string> = {
		g: 'G',
		pg: 'PG',
		pg_13: 'PG-13',
		r: 'R',
		r17: 'R-17',
		rx: 'RX',
	}
	return labels[rating] ?? rating.toUpperCase().replace('_', '-')
}

export function formatAgeRating(rating: string): string {
	const labels: Record<string, string> = {
		g: '0+',
		pg: '6+',
		pg_13: '13+',
		r: '16+',
		r17: '17+',
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

export function stripBBCode(text: string): string {
	return text
		.replace(/\[\w+=[^\]]*\]([\s\S]*?)\[\/\w+\]/g, '$1')
		.replace(/\[\w+\]([\s\S]*?)\[\/\w+\]/g, '$1')
		.replace(/\[\/?\w+[^\]]*\]/g, '')
		.trim()
}
