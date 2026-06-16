import {
	deleteAnimeComment,
	getAnimeComments,
	postAnimeComment,
	updateAnimeComment,
} from '@/api/commentsApi'
import type { AnimeComment } from '@/types/reviews'
import { collectDescendantIds, groupRepliesByParent } from '@/utils/comments/commentTree'
import { useEffect, useMemo, useState } from 'react'

export function useAnimeComments(animeId: number) {
	const [comments, setComments] = useState<AnimeComment[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		let isCancelled = false
		setIsLoading(true)

		getAnimeComments(animeId)
			.then(items => {
				if (!isCancelled) setComments(items)
			})
			.catch(() => {
				if (!isCancelled) setComments([])
			})
			.finally(() => {
				if (!isCancelled) setIsLoading(false)
			})

		return () => {
			isCancelled = true
		}
	}, [animeId])

	const threads = useMemo(() => {
		const topLevel = comments.filter(c => !c.parent_id)
		const repliesByParent = groupRepliesByParent(comments)
		return { topLevel, repliesByParent }
	}, [comments])

	async function onReply(parentId: number, text: string) {
		const reply = await postAnimeComment(animeId, text, parentId)
		setComments(prev => [reply, ...prev])
	}

	async function onDelete(commentId: number) {
		await deleteAnimeComment(commentId)
		// Remove the whole subtree (matches the recursive delete on the server).
		setComments(prev => {
			const remove = collectDescendantIds(
				groupRepliesByParent(prev),
				commentId,
			)
			return prev.filter(c => !remove.has(c.id))
		})
	}

	async function onEdit(commentId: number, text: string) {
		const updated = await updateAnimeComment(commentId, text)
		setComments(prev =>
			prev.map(c => (c.id === commentId ? { ...c, ...updated } : c)),
		)
	}

	return {
		comments,
		isLoading,
		...threads,
		onPosted: (comment: AnimeComment) =>
			setComments(prev => [comment, ...prev]),
		onReply,
		onDelete,
		onEdit,
	}
}
