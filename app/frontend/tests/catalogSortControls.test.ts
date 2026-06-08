import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { sortOptions } from '../src/utils/catalogData'

describe('catalog sort controls', () => {
	test('uses the requested labels with active sort direction support', () => {
		expect(sortOptions).toEqual(['дате добавления', 'новизне', 'рейтингу'])
	})

	test('maps sort labels and direction to backend params', () => {
		const hookSource = readFileSync(
			resolve(import.meta.dir, '../src/features/catalog/hooks/useAnimeCatalog.ts'),
			'utf8',
		)
		const componentSource = readFileSync(
			resolve(import.meta.dir, '../src/features/catalog/components/AnimeCatalog.tsx'),
			'utf8',
		)
		const dropdownSource = readFileSync(
			resolve(import.meta.dir, '../src/features/catalog/components/SortDropdown.tsx'),
			'utf8',
		)

		expect(hookSource).toContain('order: sortDirection')
		expect(hookSource).toContain("option === 'дате добавления'")
		expect(hookSource).toContain("option === 'рейтингу'")
		expect(hookSource).toContain("return 'date'")
		expect(hookSource).toContain("return 'rating'")
		expect(componentSource).toContain('toggleSortOption')
		expect(componentSource).toContain("direction === 'desc' ? 'asc' : 'desc'")
		expect(dropdownSource).toContain('sortDirection')
	})
})
