import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
	HOME_ADVANTAGES,
	HOME_FREE_TITLE,
	HOME_INTRO_TITLE,
} from '../src/utils/catalogData'

describe('home page data', () => {
	test('loads the home anime rail from the API instead of static season stubs', () => {
		const source = readFileSync(
			resolve(import.meta.dir, '../src/pages/HomePage.tsx'),
			'utf8',
		)

		expect(source).toContain('getCatalog')
		expect(source).toContain("sort: 'novelty'")
		expect(source).not.toContain('HOME_SEASON_ANIME')
	})

	test('contains home copy blocks for the AnimeWatch landing page', () => {
		expect(HOME_INTRO_TITLE).toBe(
			'AnimeWatch — смотреть аниме онлайн бесплатно',
		)
		expect(HOME_FREE_TITLE).toBe(
			'На AnimeWatch — только бесплатные аниме без регистрации',
		)
		expect(HOME_ADVANTAGES.length).toBe(4)
		expect(HOME_ADVANTAGES.join(' ')).toContain('аниме онлайн')
		expect(HOME_ADVANTAGES.join(' ')).not.toContain('AnimeGO')
	})
})
