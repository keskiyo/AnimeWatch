import {
	deleteAnimeComment,
	getAnimeComments,
	postAnimeComment,
	updateAnimeComment,
} from '@/api/commentsApi'
import { CommentCard } from '@/features/animepage/components/comments/CommentCard'
import { CommentEditor } from '@/features/animepage/components/comments/CommentEditor'
import type { AnimeComment } from '@/types/reviews'
import { useEffect, useMemo, useState } from 'react'

const PAGE_SIZE = 20

type ReviewsAnimePageProps = {
	animeId: number
}

/** Блок «Отзывы»: комментарии аниме с ответами, лайками и редактированием. */
export function ReviewsAnimePage({ animeId }: ReviewsAnimePageProps) {
	const [comments, setComments] = useState<AnimeComment[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

	useEffect(() => {
		let isCancelled = false
		setIsLoading(true)
		setVisibleCount(PAGE_SIZE)

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

	// One-level threads: top-level comments + their replies (oldest first)
	const { topLevel, repliesByParent } = useMemo(() => {
		const top: AnimeComment[] = []
		const byParent = new Map<number, AnimeComment[]>()
		for (const comment of comments) {
			if (comment.parent_id) {
				const list = byParent.get(comment.parent_id) ?? []
				list.unshift(comment)
				byParent.set(comment.parent_id, list)
			} else {
				top.push(comment)
			}
		}
		return { topLevel: top, repliesByParent: byParent }
	}, [comments])

	function onPosted(comment: AnimeComment) {
		setComments(prev => [comment, ...prev]) // newest first
	}

	async function onReply(parentId: number, text: string) {
		const reply = await postAnimeComment(animeId, text, parentId)
		setComments(prev => [reply, ...prev])
	}

	async function onDelete(commentId: number) {
		await deleteAnimeComment(commentId)
		// The server removes replies with the parent — mirror it locally
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

	const visibleComments = topLevel.slice(0, visibleCount)
	const hasMore = visibleCount < topLevel.length

	return (
		<section className='rounded-lg bg-aw-surface px-5 py-4'>
			<h2 className='m-0 mb-5 text-2xl font-normal leading-tight text-aw-text'>
				Комментарии{comments.length > 0 ? ` (${comments.length})` : ''}
			</h2>

			<CommentEditor animeId={animeId} onPosted={onPosted} />

			<div className='mt-6 grid gap-8'>
				{isLoading ? (
					<CommentsSkeleton />
				) : visibleComments.length === 0 ? (
					<p className='m-0 py-4 text-center text-aw-subtle'>
						Комментариев пока нет — будьте первым!
					</p>
				) : (
					visibleComments.map(comment => (
						<CommentCard
							key={comment.id}
							comment={comment}
							onDelete={onDelete}
							onEdit={onEdit}
							onReply={onReply}
						>
							{(repliesByParent.get(comment.id) ?? []).map(
								reply => (
									<div key={reply.id} className='mt-5'>
										<CommentCard
											comment={reply}
											onDelete={onDelete}
											onEdit={onEdit}
											onReply={onReply}
										/>
									</div>
								),
							)}
						</CommentCard>
					))
				)}
			</div>

			{hasMore && (
				<div className='mt-6 flex justify-center'>
					<button
						type='button'
						onClick={() =>
							setVisibleCount(count => count + PAGE_SIZE)
						}
						className='cursor-pointer border-b border-dashed border-aw-text bg-transparent text-sm text-aw-text hover:text-aw-accent'
					>
						Показать ещё ({topLevel.length - visibleCount})
					</button>
				</div>
			)}
		</section>
	)
}

function CommentsSkeleton() {
	return (
		<div className='grid animate-pulse gap-8' aria-hidden='true'>
			{Array.from({ length: 3 }, (_, i) => (
				<div key={i} className='flex gap-4'>
					<span className='h-14 w-14 shrink-0 rounded-full bg-aw-elevated' />
					<span className='grid flex-1 content-start gap-2'>
						<span className='h-4 w-40 rounded bg-aw-elevated' />
						<span className='h-4 w-full rounded bg-aw-elevated' />
						<span className='h-4 w-2/3 rounded bg-aw-elevated' />
					</span>
				</div>
			))}
		</div>
	)
}
