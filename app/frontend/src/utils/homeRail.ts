import type { Anime } from '@/types/anime'

const SEASON_RANK: Record<string, number> = {
	winter: 0,
	spring: 1,
	summer: 2,
	fall: 3,
}

// Ongoings that already aired more than this are long-runners (One Piece,
// Detective Conan, …) — they keep airing for years and aren't "new".
const LONG_RUNNER_EPISODES = 60

/** Sort key by start date (newest first): year, then season within the year. */
function startScore(anime: Anime): number {
	return anime.year * 4 + (anime.season ? (SEASON_RANK[anime.season] ?? 0) : 0)
}

/**
 * New ongoings for the home rail: only currently-airing titles that started
 * recently (this or last year) and aren't long-runners, newest first.
 */
export function selectNewOngoings(anime: Anime[], limit?: number): Anime[] {
	const minYear = new Date().getFullYear() - 1
	const fresh = anime
		.filter(
			item =>
				item.status === 'ongoing' &&
				item.year >= minYear &&
				(item.episodes_aired ?? 0) <= LONG_RUNNER_EPISODES,
		)
		.sort((a, b) => startScore(b) - startScore(a))

	return typeof limit === 'number' ? fresh.slice(0, limit) : fresh
}
