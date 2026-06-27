import { describe, expect, test } from 'vitest'
import type { Anime } from '@/types/anime'
import { applySort } from '@/utils/catalog/catalogClientFilter'

function anime(part: Partial<Anime>): Anime {
	return {
		id: 1,
		title_ru: '',
		title_en: '',
		status: 'released',
		year: 2020,
		rating: 7,
		aired_on: '',
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

	test('novelty desc excludes announced and starts from newest visible titles', () => {
		const ids = applySort(
			[
				anime({ id: 1, status: 'released', year: 2024, aired_on: '2024-01-01' }),
				anime({ id: 2, status: 'announced', year: 2027, aired_on: '2027-01-01' }),
				anime({ id: 3, status: 'released', year: 2024, aired_on: '2024-10-01' }),
			],
			'новизне',
			'desc',
			true,
		).map(a => a.id)
		expect(ids).toEqual([3, 1])
	})

	test('novelty asc excludes announced', () => {
		const ids = applySort(list, 'новизне', 'asc', true).map(a => a.id)
		expect(ids).toEqual([3, 1])
	})

	test('novelty keeps announced when explicitly requested by filters', () => {
		const ids = applySort(list, 'новизне', 'desc', false).map(a => a.id)
		expect(ids).toEqual([1, 3, 2])
	})

	test('novelty can render an announced-only result set', () => {
		const announced = anime({ id: 2, status: 'announced', year: 2027 })
		const ids = applySort([announced], 'новизне', 'desc', false).map(a => a.id)
		expect(ids).toEqual([2])
	})

	test('other sorts keep announced last', () => {
		const ids = applySort(list, 'рейтингу', 'desc').map(a => a.id)
		expect(ids[ids.length - 1]).toBe(2) // announced at the bottom
	})
})
