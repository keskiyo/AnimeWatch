import {
	deleteAnimeComment,
	getAnimeComments,
	postAnimeComment,
	updateAnimeComment,
} from '@/api/commentsApi'
import type { AnimeComment } from '@/types/reviews'
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
		const topLevel: AnimeComment[] = []
		const repliesByParent = new Map<number, AnimeComment[]>()
		for (const comment of comments) {
			if (comment.parent_id) {
				const list = repliesByParent.get(comment.parent_id) ?? []
				list.unshift(comment)
				repliesByParent.set(comment.parent_id, list)
			} else {
				topLevel.push(comment)
			}
		}
		return { topLevel, repliesByParent }
	}, [comments])

	async function onReply(parentId: number, text: string) {
		const reply = await postAnimeComment(animeId, text, parentId)
		setComments(prev => [reply, ...prev])
	}

	async function onDelete(commentId: number) {
		await deleteAnimeComment(commentId)
		setComments(prev =>
			prev.filter(c => c.id !== commentId && c.parent_id !== commentId),
		)
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
