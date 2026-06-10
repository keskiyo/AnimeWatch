import type { Anime, KodikPlayer, RelatedAnime } from '@/types/anime'
import type {
	AnimeFrame,
	AnimePageData,
	AnimePlayerEpisode,
	AnimePlayerTrack,
	AnimeScheduleRow,
} from '@/types/animePage'
import { createInfoRows } from '@/utils/animeInfoRows'
import {
	createPlayerBackground,
	formatScheduleDate,
	getNextEpisodeText,
	getPositiveCount,
	normalizeAnimeTitle,
	stripBBCode,
} from '@/utils/animePageFormatters'
import { DEFAULT_DESCRIPTION } from '@/utils/animePageStaticData'

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
			: [...DEFAULT_DESCRIPTION],
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

function createPlayerTracks(
	player: KodikPlayer | undefined,
): AnimePlayerTrack[] {
	if (!player?.available) {
		return []
	}

	// All dubbing teams from Kodik (one search result per translation)
	const translations = player.translations ?? []
	if (translations.length > 0) {
		return translations.map((t, index) => ({
			id: t.id,
			label: t.title,
			isActive: index === 0,
			link: t.link,
			episodesCount: t.episodes_count,
		}))
	}

	// Fallback: single translation from the main player payload
	if (player.episodes_count <= 0 || !player.translation) {
		return []
	}

	return [
		{
			id: 'kodik',
			label: player.translation,
			isActive: true,
			link: player.link,
			episodesCount: player.episodes_count,
		},
	]
}

function createPlayerProviders(
	player: KodikPlayer | undefined,
): AnimePageData['playerProviders'] {
	// Kodik is the only integrated player for now; the list is data-driven
	// so future providers (Yumyanime, …) just append here.
	if (player?.available) {
		return [{ id: 'kodik', label: 'Kodik' }]
	}
	return []
}

function createPlayerEpisodes(
	count: number,
	player?: KodikPlayer,
): AnimePlayerEpisode[] {
	const visibleCount = Math.max(count, 0)

	return Array.from({ length: visibleCount }, (_, index) => {
		const episodeNumber = index + 1

		const title = player?.available
			? (player.episode_titles?.[episodeNumber] ??
				player.episode_titles?.[episodeNumber - 1] ??
				null)
			: null

		return {
			number: episodeNumber,
			isActive: index === 0,
			title,
		}
	})
}

function createScheduleRows(
	anime: Anime,
	player?: KodikPlayer,
): AnimeScheduleRow[] {
	// Only build a schedule for ongoing anime
	if (anime.status !== 'ongoing') return []

	const episodeTitles: Record<string, string> = player?.available
		? (player.episode_titles ?? {})
		: {}

	const rows: AnimeScheduleRow[] = []

	// Rows for already-aired episodes
	const aired = anime.episodes_aired ?? 0
	for (let i = 1; i <= aired; i++) {
		rows.push({
			episode: String(i),
			title: episodeTitles[String(i)] || 'Неизвестно',
			releaseDate: 'Неизвестно',
			status: 'released',
		})
	}

	// Row for the next upcoming episode (if we know when it airs)
	if (anime.next_episode_at) {
		const nextNum = aired + 1
		rows.push({
			episode: String(nextNum),
			title: episodeTitles[String(nextNum)] || 'Неизвестно',
			releaseDate: formatScheduleDate(anime.next_episode_at),
			status: 'soon',
		})
	}

	return rows
}
