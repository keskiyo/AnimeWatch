import { voteAnimeComment } from '@/api/commentsApi'
import { openAuthModal } from '@/features/auth/authModalBus'
import { useAuthUser } from '@/features/auth/useAuthUser'
import type { AnimeComment } from '@/types/reviews'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

const ACTION_BUTTON =
	'inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-sm text-aw-subtle transition-colors hover:text-aw-text'

type CommentActionsProps = {
	comment: AnimeComment
	onReply: (text: string) => Promise<void>
}

/** Like / dislike / reply row under a comment (grey, compact, one line). */
export function CommentActions({ comment, onReply }: CommentActionsProps) {
	const { user } = useAuthUser()
	const [likes, setLikes] = useState(comment.likes)
	const [dislikes, setDislikes] = useState(comment.dislikes)
	const [myVote, setMyVote] = useState(comment.my_vote)
	const [isReplying, setIsReplying] = useState(false)
	const [replyText, setReplyText] = useState('')
	const [isBusy, setIsBusy] = useState(false)

	async function vote(value: 1 | -1) {
		if (!user) {
			openAuthModal()
			return
		}
		if (isBusy) return
		setIsBusy(true)
		try {
			// Clicking the same button again removes the vote
			const result = await voteAnimeComment(
				comment.id,
				myVote === value ? 0 : value,
			)
			setLikes(result.likes)
			setDislikes(result.dislikes)
			setMyVote(result.my_vote)
		} finally {
			setIsBusy(false)
		}
	}

	async function sendReply() {
		const text = replyText.trim()
		if (!text || isBusy) return
		setIsBusy(true)
		try {
			await onReply(text)
			setReplyText('')
			setIsReplying(false)
		} finally {
			setIsBusy(false)
		}
	}

	function onReplyKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			void sendReply()
		}
	}

	return (
		<div className='mt-2'>
			<div className='flex items-center gap-4'>
				<button
					type='button'
					onClick={() => void vote(1)}
					aria-label='Нравится'
					className={`${ACTION_BUTTON} ${myVote === 1 ? 'text-aw-accent' : ''}`}
				>
					<ThumbsUp size={16} aria-hidden='true' />
					{likes > 0 && <span>{likes}</span>}
				</button>
				<button
					type='button'
					onClick={() => void vote(-1)}
					aria-label='Не нравится'
					className={`${ACTION_BUTTON} ${myVote === -1 ? 'text-aw-accent' : ''}`}
				>
					<ThumbsDown size={16} aria-hidden='true' />
					{dislikes > 0 && <span>{dislikes}</span>}
				</button>
				<button
					type='button'
					onClick={() =>
						user ? setIsReplying(value => !value) : openAuthModal()
					}
					className={ACTION_BUTTON}
				>
					Ответить
				</button>
			</div>

			{isReplying && (
				<div className='mt-2'>
					<textarea
						value={replyText}
						onChange={e => setReplyText(e.target.value)}
						onKeyDown={onReplyKeyDown}
						maxLength={2000}
						autoFocus
						placeholder={`Ответ для ${comment.username}…`}
						className='h-20 w-full resize-none rounded-xl border border-aw-border bg-[#3a3a3a] px-3 py-2 text-sm text-aw-text outline-none placeholder:text-aw-subtle focus:border-aw-accent'
					/>
					<div className='mt-1.5 flex gap-2'>
						<button
							type='button'
							onClick={() => void sendReply()}
							disabled={isBusy || !replyText.trim()}
							className='cursor-pointer rounded-md bg-aw-accent px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
						>
							Отправить
						</button>
						<button
							type='button'
							onClick={() => setIsReplying(false)}
							className='cursor-pointer rounded-md border border-aw-border bg-transparent px-3 py-1.5 text-sm text-aw-subtle transition-colors hover:text-aw-text'
						>
							Отмена
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
