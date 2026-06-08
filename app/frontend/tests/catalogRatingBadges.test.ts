import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('catalog rating badges', () => {
	test('shows Shikimori rating on catalog posters and home rail posters', () => {
		const catalogCardSource = readFileSync(
			resolve(import.meta.dir, '../src/features/catalog/components/AnimeCard.tsx'),
			'utf8',
		)
		const homeSource = readFileSync(
			resolve(import.meta.dir, '../src/pages/HomePage.tsx'),
			'utf8',
		)

		expect(catalogCardSource).toContain('formatAnimeRating')
		expect(catalogCardSource).toContain('anime.rating')
		expect(homeSource).toContain('formatAnimeRating')
		expect(homeSource).toContain('anime.rating')
	})
})
