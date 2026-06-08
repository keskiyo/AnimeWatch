import { describe, expect, test } from 'bun:test'
import type { Anime, KodikPlayer } from '../src/types/anime'
import { createAnimePageData } from '../src/utils/animePageData'

describe('anime page API data', () => {
	test('builds page data from API anime and Kodik player', () => {
		const anime: Anime = {
			id: 5114,
			title_ru: 'Стальной алхимик: Братство',
			title_en: 'Fullmetal Alchemist: Brotherhood',
			title_jp: '鋼の錬金術師',
			poster_url: 'https://shikimori.one/system/animes/original/5114.jpg',
			description: 'Alchemy story',
			genres: ['Сёнен', 'Экшен'],
			studio: 'Bones',
			type: 'tv',
			status: 'released',
			year: 2009,
			season: 'spring',
			episodes_total: 64,
			episodes_aired: 64,
			rating: 9.11,
			score_count: 1000,
			updated_at: '2026-06-01T00:00:00.000Z',
		}
		const player: KodikPlayer = {
			available: true,
			provider: 'kodik',
			link: 'https://kodik.info/serial/5114/hash/720p',
			translation: 'AniLibria',
			quality: '720p',
			episodes_count: 64,
			screenshots: [],
		}

		const data = createAnimePageData(anime, player)

		expect(data.fullTitle).toBe('Стальной алхимик: Братство')
		expect(data.player?.available).toBe(true)
		expect(data.playerTracks[0]?.label).toBe('AniLibria')
		expect(data.playerEpisodes).toHaveLength(12)
		expect(data.infoRows.some(row => row.value === 'Bones')).toBe(true)
	})
})
