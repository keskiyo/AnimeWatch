import type { AnimeComment } from '@/types/reviews'

/** All comment ids in the subtree rooted at `rootId` (the root included). */
export function collectDescendantIds(
	repliesByParent: Map<string, AnimeComment[]>,
	rootId: string,
): Set<string> {
	const ids = new Set<string>([rootId])
	const stack = [rootId]
	while (stack.length > 0) {
		const id = stack.pop() as string
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
): Map<string, AnimeComment[]> {
	const byParent = new Map<string, AnimeComment[]>()
	for (const comment of comments) {
		if (!comment.parent_id) continue
		const list = byParent.get(comment.parent_id) ?? []
		list.push(comment)
		byParent.set(comment.parent_id, list)
	}
	return byParent
}
