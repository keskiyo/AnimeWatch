import type { AnimeComment } from '@/types/reviews'

/** All comment ids in the subtree rooted at `rootId` (the root included). */
export function collectDescendantIds(
	repliesByParent: Map<number, AnimeComment[]>,
	rootId: number,
): Set<number> {
	const ids = new Set<number>([rootId])
	const stack = [rootId]
	while (stack.length > 0) {
		const id = stack.pop() as number
		for (const child of repliesByParent.get(id) ?? []) {
			if (!ids.has(child.id)) {
				ids.add(child.id)
				stack.push(child.id)
			}
		}
	}
	return ids
}

/** Group replies by their parent id (top-level comments have no parent). */
export function groupRepliesByParent(
	comments: AnimeComment[],
): Map<number, AnimeComment[]> {
	const byParent = new Map<number, AnimeComment[]>()
	for (const comment of comments) {
		if (!comment.parent_id) continue
		const list = byParent.get(comment.parent_id) ?? []
		list.push(comment)
		byParent.set(comment.parent_id, list)
	}
	return byParent
}
