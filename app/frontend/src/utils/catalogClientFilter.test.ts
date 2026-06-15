import { describe, expect, test } from 'vitest'
import type { Anime } from '@/types/anime'
import { applySort } from '@/utils/catalogClientFilter'

function anime(part: Partial<Anime>): Anime {
	return {
		id: 1,
		title_ru: '',
		title_en: '',
		status: 'released',
		year: 2020,
		rating: 7,
		updated_at: '2026-01-01T00:00:00Z',
		...part,
	} as Anime
}

describe('applySort', () => {
	const list = [
		anime({ id: 1, status: 'released', year: 2024 }),
		anime({ id: 2, status: 'announced', year: 2027 }),
		anime({ id: 3, status: 'released', year: 2023 }),
	]

	test('novelty desc puts announced first', () => {
		const ids = applySort(list, 'новизне', 'desc').map(a => a.id)
		expect(ids[0]).toBe(2) // announced on top
		expect(ids).toEqual([2, 1, 3])
	})

	test('novelty asc puts announced last', () => {
		const ids = applySort(list, 'новизне', 'asc').map(a => a.id)
		expect(ids[ids.length - 1]).toBe(2) // announced at the bottom
	})

	test('other sorts keep announced last', () => {
		const ids = applySort(list, 'рейтингу', 'desc').map(a => a.id)
		expect(ids[ids.length - 1]).toBe(2) // announced at the bottom
	})
})
