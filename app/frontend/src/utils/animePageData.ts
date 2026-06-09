import type { Anime, KodikPlayer, RelatedAnime } from '@/types/anime'
import type {
	AnimeFrame,
	AnimePageData,
	AnimePlayerEpisode,
	AnimePlayerTrack,
} from '@/types/animePage'
import {
	createPlayerBackground,
	formatAgeRating,
	formatAnimeType,
	formatDuration,
	formatEpisodes,
	formatRatingMpaa,
	formatSeason,
	formatSource,
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

	// Merge Shikimori screenshots + Kodik screenshots, deduplicated
	const shikiScreenshots: string[] = anime.screenshots ?? []
	const kodikScreenshots: string[] =
		player?.available ? (player.screenshots ?? []) : []
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
		playerEpisodes: createPlayerEpisodes(episodesCount),
		activeEpisodeTitle: '',
		// Show the next episode air date only for ongoings with known schedule
		activeEpisodeDate: anime.status === 'ongoing' && anime.next_episode_at
			? anime.next_episode_at
			: '',
		scheduleRows: [],
	}
}

function createInfoRows(
	anime: Anime,
	player?: KodikPlayer,
): AnimePageData['infoRows'] {
	const rows: AnimePageData['infoRows'] = []

	// ── Следующий эпизод (only for ongoings) ──────────────────────────────────
	if (anime.status === 'ongoing') {
		const nextEp = getNextEpisodeText(anime)
		if (nextEp) rows.push({ label: 'Следующий эпизод', value: nextEp })
	}

	// ── Тип и эпизоды ─────────────────────────────────────────────────────────
	rows.push({ label: 'Тип', value: formatAnimeType(anime.type) })
	rows.push({ label: 'Эпизоды', value: formatEpisodes(anime) })

	// ── Первоисточник ─────────────────────────────────────────────────────────
	if (anime.source) {
		rows.push({ label: 'Первоисточник', value: formatSource(anime.source) })
	}

	// ── Жанры (clickable) ─────────────────────────────────────────────────────
	const genreLinks = anime.genres.map(genre => ({
		label: genre,
		href: `/anime?genres=${encodeURIComponent(genre)}`,
	}))
	rows.push({
		label: 'Жанры',
		value: anime.genres.join(', ') || 'Не указаны',
		tone: 'accent',
		links: genreLinks.length > 0 ? genreLinks : undefined,
	})

	// ── Сезон ─────────────────────────────────────────────────────────────────
	rows.push({ label: 'Сезон', value: formatSeason(anime), tone: 'accent' })

	// ── Статус ────────────────────────────────────────────────────────────────
	rows.push({ label: 'Статус', value: formatStatus(anime.status) })

	// ── Выпуск ────────────────────────────────────────────────────────────────
	rows.push({ label: 'Выпуск', value: String(anime.year) })

	// ── Рейтинг MPAA (R-17, PG-13, …) ────────────────────────────────────────
	if (anime.rating_mpaa) {
		rows.push({ label: 'Рейтинг', value: formatRatingMpaa(anime.rating_mpaa) })
	}

	// ── Возраст (badge: 0+, 13+, 17+, 18+, …) ────────────────────────────────
	const ageStr = anime.rating_mpaa
		? formatAgeRating(anime.rating_mpaa)
		: (anime.age_rating ?? '')
	if (ageStr) {
		rows.push({ label: 'Возраст', value: ageStr, tone: 'badge' })
	}

	// ── Длительность ──────────────────────────────────────────────────────────
	if (anime.duration && anime.duration > 0) {
		rows.push({ label: 'Длительность', value: formatDuration(anime.duration) })
	}

	// ── Студия (clickable) ────────────────────────────────────────────────────
	const studioLinks = anime.studio
		? [{ label: anime.studio, href: `/studio/${encodeURIComponent(anime.studio)}` }]
		: undefined
	if (anime.studio) {
		rows.push({
			label: 'Студия',
			value: anime.studio,
			tone: 'accent',
			links: studioLinks,
		})
	}

	// ── Озвучка (from Kodik player) ───────────────────────────────────────────
	if (player?.available && player.translation) {
		rows.push({ label: 'Озвучка', value: player.translation, tone: 'accent' })
	}

	// ── Оценка Shikimori ──────────────────────────────────────────────────────
	rows.push({
		label: 'Оценка',
		value: anime.rating > 0 ? anime.rating.toFixed(2) : 'Нет оценок',
	})

	// ── Режиссёр (clickable links to Shikimori) ───────────────────────────────
	if (anime.directors && anime.directors.length > 0) {
		rows.push({
			label: 'Режиссёр',
			value: anime.directors.map(d => d.name).join(', '),
			tone: 'accent',
			links: anime.directors.map(d => ({ label: d.name, href: d.url })),
		})
	}

	// ── Автор оригинала ───────────────────────────────────────────────────────
	if (anime.authors && anime.authors.length > 0) {
		rows.push({
			label: 'Автор оригинала',
			value: anime.authors.map(a => a.name).join(', '),
			tone: 'accent',
			links: anime.authors.map(a => ({ label: a.name, href: a.url })),
		})
	}

	// ── Главные герои ─────────────────────────────────────────────────────────
	if (anime.characters && anime.characters.length > 0) {
		rows.push({
			label: 'Главные герои',
			value: anime.characters.map(c => c.name).join(', '),
			tone: 'accent',
			links: anime.characters.map(c => ({ label: c.name, href: c.url })),
		})
	}

	return rows
}

function createPlayerTracks(
	player: KodikPlayer | undefined,
): AnimePlayerTrack[] {
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
