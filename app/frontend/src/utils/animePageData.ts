import type { Anime, KodikPlayer, RelatedAnime } from '@/types/anime'
import type {
	AnimeFrame,
	AnimePageData,
	AnimePlayerEpisode,
	AnimePlayerTrack,
} from '@/types/animePage'
import {
	createPlayerBackground,
	formatAnimeType,
	formatEpisodes,
	formatSeason,
	formatStatus,
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
	const episodesCount =
		getPositiveCount(player?.available ? player.episodes_count : 0) ||
		getPositiveCount(anime.episodes_aired) ||
		getPositiveCount(anime.episodes_total)

	const screenshots = player?.available ? (player.screenshots ?? []) : []
	const frames: AnimeFrame[] = screenshots.slice(0, 8).map((url, i) => ({
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
		infoRows: createInfoRows(anime),
		frames,
		relatedAnime,
		playerTitle: `Смотреть аниме «${fullTitle}» онлайн`,
		playerGradient: createPlayerBackground(anime.poster_url),
		player,
		playerTracks: createPlayerTracks(player),
		playerEpisodes: createPlayerEpisodes(episodesCount),
		activeEpisodeTitle: 'Серия 1',
		activeEpisodeDate: anime.updated_at,
		scheduleRows: [],
	}
}

function createInfoRows(anime: Anime): AnimePageData['infoRows'] {
	const genreLinks = anime.genres.map(genre => ({
		label: genre,
		href: `/anime?genres=${encodeURIComponent(genre)}`,
	}))
	const studioLinks = anime.studio
		? [{ label: anime.studio, href: `/studio/${encodeURIComponent(anime.studio)}` }]
		: undefined

	return [
		{ label: 'Следующий эпизод', value: getNextEpisodeText(anime) },
		{ label: 'Тип', value: formatAnimeType(anime.type) },
		{ label: 'Эпизоды', value: formatEpisodes(anime) },
		{
			label: 'Жанры',
			value: anime.genres.join(', ') || 'Не указаны',
			tone: 'accent',
			links: genreLinks.length > 0 ? genreLinks : undefined,
		},
		{ label: 'Сезон', value: formatSeason(anime), tone: 'accent' },
		{ label: 'Статус', value: formatStatus(anime.status) },
		{ label: 'Выпуск', value: String(anime.year) },
		{ label: 'Возраст', value: '16+', tone: 'badge' },
		{
			label: 'Студия',
			value: anime.studio || 'Не указана',
			tone: 'accent',
			links: studioLinks,
		},
		{ label: 'Рейтинг', value: anime.rating > 0 ? anime.rating.toFixed(2) : 'Нет оценок' },
	]
}

function createPlayerTracks(player: KodikPlayer | undefined): AnimePlayerTrack[] {
	if (player?.available) {
		return [{ id: 'kodik', label: player.translation, isActive: true }]
	}

	return [
		{
			id: 'kodik-unavailable',
			label: player?.message ?? 'Kodik недоступен',
			isMuted: true,
		},
	]
}

function createPlayerEpisodes(count: number): AnimePlayerEpisode[] {
	const visibleCount = Math.min(Math.max(count, 1), 12)

	return Array.from({ length: visibleCount }, (_, index) => ({
		number: index + 1,
		isActive: index === 0,
	}))
}
