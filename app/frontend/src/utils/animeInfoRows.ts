import type { Anime, KodikPlayer } from '@/types/anime'
import type { AnimeInfoRow } from '@/types/animePage'
import {
	formatAgeRating,
	formatAnimeType,
	formatDuration,
	formatEpisodes,
	formatRatingMpaa,
	formatSeason,
	formatSource,
	formatStatus,
	getNextEpisodeText,
} from '@/utils/animePageFormatters'

/** Build the info panel rows for the anime hero section. */
export function createInfoRows(
	anime: Anime,
	player?: KodikPlayer,
): AnimeInfoRow[] {
	const rows: AnimeInfoRow[] = []

	// ── Следующий эпизод (only for ongoings) ──────────────────────────────────
	if (anime.status === 'ongoing') {
		const nextEp = getNextEpisodeText(anime)
		if (nextEp) rows.push({ label: 'Следующий эпизод', value: nextEp })
	}

	// ── Тип и эпизоды ─────────────────────────────────────────────────────────
	rows.push({ label: 'Тип', value: formatAnimeType(anime.type) })
	rows.push({ label: 'Эпизоды', value: formatEpisodes(anime, player) })

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

	// ── Сезон / Статус / Выпуск ───────────────────────────────────────────────
	rows.push({ label: 'Сезон', value: formatSeason(anime), tone: 'accent' })
	rows.push({ label: 'Статус', value: formatStatus(anime.status) })
	rows.push({ label: 'Выпуск', value: String(anime.year) })

	// ── Рейтинг MPAA (R-17, PG-13, …) ────────────────────────────────────────
	if (anime.rating_mpaa) {
		rows.push({
			label: 'Рейтинг',
			value: formatRatingMpaa(anime.rating_mpaa),
		})
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
		rows.push({
			label: 'Длительность',
			value: formatDuration(anime.duration),
		})
	}

	// ── Студия (clickable) ────────────────────────────────────────────────────
	if (anime.studio) {
		rows.push({
			label: 'Студия',
			value: anime.studio,
			tone: 'accent',
			links: [
				{
					label: anime.studio,
					href: `/studio/${encodeURIComponent(anime.studio)}`,
				},
			],
		})
	}

	// ── Озвучка (from Kodik player) — each team links to its dubbing page ─────
	if (player?.available) {
		const translations = player.translations ?? []
		if (translations.length > 0) {
			rows.push({
				label: 'Озвучка',
				value: translations.map(t => t.title).join(', '),
				tone: 'accent',
				links: translations.map(t => ({
					label: t.title,
					href: `/dubbing/${encodeURIComponent(t.id)}?name=${encodeURIComponent(t.title)}`,
				})),
			})
		} else if (player.translation) {
			rows.push({
				label: 'Озвучка',
				value: player.translation,
				tone: 'accent',
			})
		}
	}

	// ── Оценка Shikimori ──────────────────────────────────────────────────────
	rows.push({
		label: 'Оценка',
		value: anime.rating > 0 ? anime.rating.toFixed(2) : 'Нет оценок',
	})

	// ── Режиссёр / Автор / Главные герои (clickable links to Shikimori) ──────
	if (anime.directors && anime.directors.length > 0) {
		rows.push({
			label: 'Режиссёр',
			value: anime.directors.map(d => d.name).join(', '),
			tone: 'accent',
			links: anime.directors.map(d => ({ label: d.name, href: d.url })),
		})
	}

	if (anime.authors && anime.authors.length > 0) {
		rows.push({
			label: 'Автор оригинала',
			value: anime.authors.map(a => a.name).join(', '),
			tone: 'accent',
			links: anime.authors.map(a => ({ label: a.name, href: a.url })),
		})
	}

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
