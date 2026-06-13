import type { Anime, KodikPlayer } from '@/types/anime'
import type {
	AnimePageData,
	AnimePlayerEpisode,
	AnimePlayerTrack,
	AnimeScheduleRow,
} from '@/types/animePage'
import { formatScheduleDate } from '@/utils/animePageFormatters'

export function createPlayerTracks(
	player: KodikPlayer | undefined,
): AnimePlayerTrack[] {
	if (!player?.available) return []

	const translations = player.translations ?? []
	if (translations.length > 0) {
		return translations.map((translation, index) => ({
			id: translation.id,
			label: translation.title,
			isActive: index === 0,
			link: translation.link,
			episodesCount: translation.episodes_count,
		}))
	}

	if (player.episodes_count <= 0 || !player.translation) return []

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

export function createPlayerProviders(
	player: KodikPlayer | undefined,
): AnimePageData['playerProviders'] {
	if (player?.available) {
		return [{ id: 'kodik', label: 'Kodik' }]
	}
	return []
}

export function createPlayerEpisodes(
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

export function createScheduleRows(
	anime: Anime,
	player?: KodikPlayer,
): AnimeScheduleRow[] {
	if (anime.status !== 'ongoing') return []

	const episodeTitles: Record<string, string> = player?.available
		? (player.episode_titles ?? {})
		: {}
	const rows: AnimeScheduleRow[] = []
	const aired = anime.episodes_aired ?? 0

	for (let episode = 1; episode <= aired; episode++) {
		rows.push({
			episode: String(episode),
			title: episodeTitles[String(episode)] || 'Неизвестно',
			releaseDate: 'Неизвестно',
			status: 'released',
		})
	}

	if (anime.next_episode_at) {
		const nextEpisode = aired + 1
		rows.push({
			episode: String(nextEpisode),
			title: episodeTitles[String(nextEpisode)] || 'Неизвестно',
			releaseDate: formatScheduleDate(anime.next_episode_at),
			status: 'soon',
		})
	}

	return rows
}
