import { describe, expect, test } from 'vitest'
import type { Anime } from '@/types/anime'
import { selectNewOngoings } from '@/utils/homeRail'

const YEAR = new Date().getFullYear()

function anime(part: Partial<Anime>): Anime {
	return {
		id: 1,
		title_ru: '',
		title_en: '',
		status: 'ongoing',
		year: YEAR,
		episodes_aired: 4,
		...part,
	} as Anime
}

describe('selectNewOngoings', () => {
	test('keeps fresh ongoings, drops long-runners and old/released', () => {
		const list = [
			anime({ id: 1, year: YEAR, episodes_aired: 4 }), // fresh
			anime({ id: 2, year: 1999, episodes_aired: 1100 }), // long-runner
			anime({ id: 3, year: YEAR, status: 'released' }), // not ongoing
			anime({ id: 4, year: YEAR - 5, episodes_aired: 10 }), // too old
		]
		const ids = selectNewOngoings(list).map(a => a.id)
		expect(ids).toEqual([1])
	})

	test('sorts newest first by year then season', () => {
		const list = [
			anime({ id: 1, year: YEAR - 1, season: 'fall' }),
			anime({ id: 2, year: YEAR, season: 'winter' }),
			anime({ id: 3, year: YEAR, season: 'summer' }),
		]
		expect(selectNewOngoings(list).map(a => a.id)).toEqual([3, 2, 1])
	})

	test('respects the limit', () => {
		const list = Array.from({ length: 5 }, (_, i) => anime({ id: i + 1 }))
		expect(selectNewOngoings(list, 2)).toHaveLength(2)
	})
})
