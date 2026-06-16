import type { Anime, KodikPlayer, RelatedAnime } from '@/types/anime'
import type { AnimeFrame, AnimePageData } from '@/types/animePage'
import { createInfoRows } from '@/utils/animepage/animeInfoRows'
import {
	createPlayerBackground,
	getNextEpisodeText,
	getPositiveCount,
	normalizeAnimeTitle,
	stripBBCode,
} from '@/utils/animepage/animePageFormatters'
import {
	createPlayerEpisodes,
	createPlayerProviders,
	createPlayerTracks,
	createScheduleRows,
} from '@/utils/animepage/animePagePlayerData'

const UNKNOWN_TEXT = 'Неизвестно'

export function createAnimePageData(
	anime: Anime,
	player?: KodikPlayer,
	relatedAnime: RelatedAnime[] = [],
): AnimePageData {
	const fullTitle = normalizeAnimeTitle(anime.title_ru || anime.title_en)
	// Max episode count across all dubbing tracks — different teams may have
	// voiced a different number of episodes.
	const kodikEpisodesCount = player?.available
		? Math.max(
				player.episodes_count,
				...(player.translations ?? []).map(t => t.episodes_count),
			)
		: 0
	const availableEpisodesCount =
		getPositiveCount(kodikEpisodesCount) ||
		getPositiveCount(anime.episodes_aired) ||
		0

	// Merge Shikimori screenshots + Kodik screenshots, deduplicated
	const shikiScreenshots: string[] = anime.screenshots ?? []
	const kodikScreenshots: string[] = player?.available
		? (player.screenshots ?? [])
		: []
	const allScreenshots = [
		...shikiScreenshots,
		...kodikScreenshots.filter(u => !shikiScreenshots.includes(u)),
	]
	const frames: AnimeFrame[] = allScreenshots.slice(0, 20).map((url, i) => ({
		id: `screenshot-${i}`,
		label: `Кадр ${i + 1}`,
		gradient: 'transparent',
		imageUrl: url,
	}))

	return {
		anime,
		fullTitle,
		description: anime.description
			? [stripBBCode(anime.description)]
			: [UNKNOWN_TEXT],
		nextEpisode: getNextEpisodeText(anime),
		infoRows: createInfoRows(anime, player),
		frames,
		relatedAnime,
		playerTitle: `Смотреть аниме «${fullTitle}» онлайн`,
		playerGradient: createPlayerBackground(anime.poster_url),
		player,
		playerTracks: createPlayerTracks(player),
		playerProviders: createPlayerProviders(player),
		playerEpisodes: createPlayerEpisodes(availableEpisodesCount, player),
		activeEpisodeTitle: '',
		// Show the next episode air date only for ongoings with known schedule
		activeEpisodeDate:
			anime.status === 'ongoing' && anime.next_episode_at
				? anime.next_episode_at
				: '',
		scheduleRows: createScheduleRows(anime, player),
	}
}

