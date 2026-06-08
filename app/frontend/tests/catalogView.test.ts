import { describe, expect, test } from 'bun:test'
import type { CatalogAnime } from '../src/types/catalog'
import {
	CATALOG_VIEW_MODES,
	NAV_ITEMS,
	getCatalogViewState,
	sortCatalogAnime,
} from '../src/utils/catalogData'

const catalogAnimeFixture: CatalogAnime[] = Array.from(
	{ length: 8 },
	(_, index) => ({
		id: index + 1,
		originalTitle: `Anime ${index + 1}`,
		russianTitle: `Аниме ${index + 1}`,
		type: 'tv',
		year: 2020 + index,
		genres: ['Action'],
		rating: [8.8, 8.5, 8.2, 7.9, 7.7, 7.4, 7.1, 6.9][index]!,
		description: '',
		addedAt: new Date(Date.UTC(2026, 0, 8 - index)).toISOString(),
		gradient: 'linear-gradient(#111, #222)',
		posterLabel: `A${index + 1}`,
	}),
)

describe('catalog view data', () => {
	test('does not expose year-only navigation pages', () => {
		expect(NAV_ITEMS).toEqual([
			'Аниме',
			'Онгоинг',
			'Случайное аниме',
		])
	})

	test('keeps shared view limits without extra descriptions', () => {
		const states = CATALOG_VIEW_MODES.map(mode =>
			getCatalogViewState(mode.id, catalogAnimeFixture),
		)

		expect(CATALOG_VIEW_MODES.map(mode => mode.limit)).toEqual([12, 12, 12])
		expect(states.every(state => !('description' in state))).toBe(true)
	})

	test('keeps the current rendered item count per view mode', () => {
		expect(
			CATALOG_VIEW_MODES.map(mode => [
				mode.id,
				getCatalogViewState(mode.id, catalogAnimeFixture).items.length,
			]),
		).toEqual([
			['poster', 8],
			['compact', 8],
			['list', 8],
		])
	})

	test('sorts the provided anime collection by selected sort option', () => {
		expect(
			sortCatalogAnime(catalogAnimeFixture, 'рейтингу').map(
				anime => anime.rating,
			),
		).toEqual([8.8, 8.5, 8.2, 7.9, 7.7, 7.4, 7.1, 6.9])
		expect(
			sortCatalogAnime(catalogAnimeFixture, 'новизне').map(
				anime => anime.id,
			),
		).toEqual([8, 7, 6, 5, 4, 3, 2, 1])
		expect(
			sortCatalogAnime(catalogAnimeFixture, 'дате добавления').map(
				anime => anime.id,
			),
		).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
	})
})
