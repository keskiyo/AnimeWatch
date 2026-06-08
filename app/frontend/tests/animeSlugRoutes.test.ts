import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createAnimeSlug, parseAnimeSlugId } from '../src/utils/animeSlug'

describe('anime slug routes', () => {
	test('creates readable anime detail slugs from ids and titles', () => {
		expect(createAnimeSlug(56321, 'Zhong Kui')).toBe('56321-zhong-kui')
		expect(createAnimeSlug(42, 'Frieren: Beyond Journey End')).toBe(
			'42-frieren-beyond-journey-end',
		)
	})

	test('parses the numeric id from slug route params', () => {
		expect(parseAnimeSlugId('56321-zhong-kui')).toBe(56321)
		expect(parseAnimeSlugId('bad-slug')).toBeUndefined()
	})

	test('app and cards use plural slug detail routes', () => {
		const appSource = readFileSync(
			resolve(import.meta.dir, '../src/app/App.tsx'),
			'utf8',
		)
		const catalogCardSource = readFileSync(
			resolve(
				import.meta.dir,
				'../src/features/catalog/components/AnimeCard.tsx',
			),
			'utf8',
		)

		expect(appSource).toContain("path='/animes/:animeSlug'")
		expect(catalogCardSource).toContain('createAnimeSlug')
		expect(catalogCardSource).toContain('/animes/')
	})
})
