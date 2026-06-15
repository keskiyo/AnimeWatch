import { CommentEditor } from '@/features/animepage/components/comments/CommentEditor'
import { CommentThread } from '@/features/animepage/components/comments/CommentThread'
import { CommentsSkeleton } from '@/features/animepage/components/comments/CommentsSkeleton'
import { useAnimeComments } from '@/features/animepage/hooks/useAnimeComments'
import { useEffect, useState } from 'react'

const PAGE_SIZE = 20

type ReviewsAnimePageProps = {
	animeId: number
}

/** Блок «Отзывы»: комментарии аниме с ответами, лайками и редактированием. */
export function ReviewsAnimePage({ animeId }: ReviewsAnimePageProps) {
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
	const commentsState = useAnimeComments(animeId)

	useEffect(() => setVisibleCount(PAGE_SIZE), [animeId])

	const visibleComments = commentsState.topLevel.slice(0, visibleCount)
	const hasMore = visibleCount < commentsState.topLevel.length

	return (
		<section className='rounded-lg bg-aw-surface px-5 py-4'>
			<h2 className='m-0 mb-5 text-2xl font-normal leading-tight text-aw-text'>
				Комментарии
				{commentsState.comments.length > 0
					? ` (${commentsState.comments.length})`
					: ''}
			</h2>

			<CommentEditor animeId={animeId} onPosted={commentsState.onPosted} />

			<div className='mt-6 grid gap-8'>
				{commentsState.isLoading ? (
					<CommentsSkeleton />
				) : visibleComments.length === 0 ? (
					<p className='m-0 py-4 text-center text-aw-subtle'>
						Комментариев пока нет — будьте первым!
					</p>
				) : (
					visibleComments.map(comment => (
						<CommentThread
							key={comment.id}
							comment={comment}
							repliesByParent={commentsState.repliesByParent}
							depth={0}
							onDelete={commentsState.onDelete}
							onEdit={commentsState.onEdit}
							onReply={commentsState.onReply}
						/>
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
						Показать ещё (
						{commentsState.topLevel.length - visibleCount})
					</button>
				</div>
			)}
		</section>
	)
}
