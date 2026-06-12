import type { Anime } from '@/types/anime'

export function formatAnimeYear(year?: number | null): string {
	return year && year > 0 ? String(year) : 'Неизвестно'
}

export function formatAnimeReleaseYear(anime: Anime): string {
	if (
		anime.status === 'announced' &&
		!anime.season &&
		!anime.next_episode_at
	) {
		return 'Неизвестно'
	}
	return formatAnimeYear(anime.year)
}
