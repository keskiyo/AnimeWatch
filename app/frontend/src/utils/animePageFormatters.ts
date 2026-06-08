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
