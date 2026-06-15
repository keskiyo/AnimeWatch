import { describe, expect, test } from 'vitest'
import type { AnimeComment } from '@/types/reviews'
import { collectDescendantIds, groupRepliesByParent } from '@/utils/commentTree'

function c(id: number, parent_id: number | null): AnimeComment {
	return {
		id,
		anime_id: 1,
		user_id: 1,
		parent_id,
		username: '',
		avatar_url: '',
		text: '',
		likes: 0,
		dislikes: 0,
		my_vote: 0,
	} as AnimeComment
}

describe('commentTree', () => {
	// 1 → 2 → 4, 1 → 3 ; 5 unrelated
	const list = [c(1, null), c(2, 1), c(3, 1), c(4, 2), c(5, null)]
	const byParent = groupRepliesByParent(list)

	test('collects the whole subtree including the root', () => {
		expect(collectDescendantIds(byParent, 1)).toEqual(new Set([1, 2, 3, 4]))
	})

	test('collects a mid-tree subtree', () => {
		expect(collectDescendantIds(byParent, 2)).toEqual(new Set([2, 4]))
	})

	test('leaf / unrelated node is just itself', () => {
		expect(collectDescendantIds(byParent, 5)).toEqual(new Set([5]))
	})
})
