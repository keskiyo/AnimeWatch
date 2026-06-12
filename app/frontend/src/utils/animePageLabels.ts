import type { Anime } from '@/types/anime'
import { formatAnimeReleaseYear } from '@/utils/animeYear'

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
	const year = formatAnimeReleaseYear(anime)
	return anime.season ? `${labels[anime.season]} ${year}` : year
}

export function formatStatus(value: string): string {
	const labels: Record<string, string> = {
		ongoing: 'Онгоинг',
		released: 'Вышел',
		announced: 'Анонс',
	}
	return labels[value] ?? value
}

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

export function formatPlayerAgeRating(
	rating?: string | number | null,
): string | null {
	if (rating == null) return null
	const value = String(rating).toLowerCase().trim()
	if (/^\d+\+$/.test(value)) return value
	if (/^\d+$/.test(value)) return `${value}+`

	const labels: Record<string, string> = {
		g: '0+',
		pg: '7+',
		'pg-13': '13+',
		r: '17+',
		'r+': '18+',
		rx: '18+',
	}
	return labels[value] ?? String(rating)
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
