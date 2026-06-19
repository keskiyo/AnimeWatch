import { resolveAvatarUrl } from '@/api/authApi'
import { CommentActions } from '@/features/animepage/components/comments/CommentActions'
import { CommentActionsMenu } from '@/features/animepage/components/comments/CommentActionsMenu'
import { CommentEditForm } from '@/features/animepage/components/comments/CommentEditForm'
import { FormattedText } from '@/features/animepage/components/comments/FormattedText'
import { useAuthUser } from '@/features/auth/useAuthUser'
import type { AnimeComment } from '@/types/reviews'
import { notifyError, notifySuccess } from '@/utils/notify'
import { Dot } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

const FALLBACK_AVATAR = '/not-image.png'

type CommentCardProps = {
	comment: AnimeComment
	onDelete: (commentId: string) => Promise<void>
	onEdit: (commentId: string, text: string) => Promise<void>
	onReply: (parentId: string, text: string) => Promise<void>
	/** Rendered replies (one level deep). */
	children?: ReactNode
}

export function CommentCard({
	comment,
	onDelete,
	onEdit,
	onReply,
	children,
}: CommentCardProps) {
	const { user } = useAuthUser()
	const [isEditing, setIsEditing] = useState(false)
	const [draft, setDraft] = useState(comment.text)
	const [isBusy, setIsBusy] = useState(false)

	// Server enforces the same rules: author edits/deletes own, admin deletes any
	const isAuthor = user?.id === comment.user_id
	const canDelete = isAuthor || user?.role === 'admin'

	async function saveEdit() {
		const text = draft.trim()
		if (!text || isBusy) return
		setIsBusy(true)
		try {
			await onEdit(comment.id, text)
			setIsEditing(false)
			notifySuccess('Комментарий обновлён')
		} catch {
			notifyError('Не удалось сохранить изменения. Попробуйте позже.')
		} finally {
			setIsBusy(false)
		}
	}

	return (
		<article className={`flex gap-4 ${isBusy ? 'opacity-50' : ''}`}>
			<Link to={`/profile/${comment.user_id}`} className='shrink-0'>
				<img
					src={
						resolveAvatarUrl(comment.avatar_url) || FALLBACK_AVATAR
					}
					alt={`Аватар ${comment.username}`}
					className='h-14 w-14 rounded-full border border-aw-border bg-aw-elevated object-cover'
					loading='lazy'
					onError={e => {
						e.currentTarget.src = FALLBACK_AVATAR
					}}
				/>
			</Link>

			<div className='min-w-0 flex-1'>
				<div className='flex items-start justify-between gap-2'>
					<p className='m-0 flex flex-wrap items-center'>
						<Link
							to={`/profile/${comment.user_id}`}
							className='font-semibold text-aw-accent no-underline hover:underline'
						>
							{comment.username}
						</Link>
						<Dot className='h-7 w-7 text-aw-subtle' />
						<span className='text-sm text-aw-subtle'>
							{formatCommentDate(comment.created_at)}
						</span>
					</p>
					{canDelete && (
						<CommentActionsMenu
							canEdit={isAuthor}
							onEdit={() => {
								setDraft(comment.text)
								setIsEditing(true)
							}}
							onDelete={() => {
								setIsBusy(true)
								void onDelete(comment.id)
									.then(() =>
										notifySuccess('Комментарий удалён'),
									)
									.catch(() =>
										notifyError(
											'Не удалось удалить комментарий',
										),
									)
									.finally(() => setIsBusy(false))
							}}
						/>
					)}
				</div>

				{isEditing ? (
					<CommentEditForm
						draft={draft}
						isBusy={isBusy}
						onDraftChange={setDraft}
						onCancel={() => setIsEditing(false)}
						onSave={() => void saveEdit()}
					/>
				) : (
					<>
						<p className='m-0 whitespace-pre-line wrap-break-word leading-relaxed text-aw-text'>
							<FormattedText text={comment.text} />
						</p>
						<CommentActions
							comment={comment}
							onReply={text => onReply(comment.id, text)}
						/>
					</>
				)}

				{children}
			</div>
		</article>
	)
}

function formatCommentDate(iso?: string): string {
	if (!iso) return 'только что'
	try {
		return new Date(iso).toLocaleString('ru-RU', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	} catch {
		return ''
	}
}
