import { describe, expect, test } from 'vitest'
import { parseStaticPageLinks } from '@/utils/staticPage/staticPageMarkup'

describe('parseStaticPageLinks', () => {
	test('parses safe markdown links and keeps plain text', () => {
		const parts = parseStaticPageLinks('На адрес [test](mailto:test@animewatch.me)')
		expect(parts).toEqual([
			{ type: 'text', value: 'На адрес ' },
			{ type: 'link', value: 'test', href: 'mailto:test@animewatch.me' },
		])
	})

	test('does not create links for unsafe protocols', () => {
		const parts = parseStaticPageLinks('[bad](javascript:alert(1))')
		expect(parts).toEqual([{ type: 'text', value: '[bad](javascript:alert(1))' }])
	})
})
