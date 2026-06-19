import { CommentCard } from '@/features/animepage/components/comments/CommentCard'
import type { AnimeComment } from '@/types/reviews'
import { useState } from 'react'

const VISIBLE_REPLIES = 3 // direct replies shown before the "Ещё N" expander
const MAX_INDENT_DEPTH = 6 // stop growing the indent so deep threads don't run off

type CommentThreadProps = {
	comment: AnimeComment
	repliesByParent: Map<string, AnimeComment[]>
	depth: number
	onReply: (parentId: string, text: string) => Promise<void>
	onEdit: (commentId: string, text: string) => Promise<void>
	onDelete: (commentId: string) => Promise<void>
}

/** One comment node + its nested replies (recursive, Reddit-style tree). */
export function CommentThread({
	comment,
	repliesByParent,
	depth,
	onReply,
	onEdit,
	onDelete,
}: CommentThreadProps) {
	const replies = repliesByParent.get(comment.id) ?? []
	const [collapsed, setCollapsed] = useState(false)
	const [showAll, setShowAll] = useState(false)

	const shown = showAll ? replies : replies.slice(0, VISIBLE_REPLIES)
	const hiddenCount = replies.length - shown.length

	return (
		<CommentCard
			comment={comment}
			onDelete={onDelete}
			onEdit={onEdit}
			onReply={onReply}
		>
			{replies.length > 0 && (
				<div className='mt-4'>
					<button
						type='button'
						onClick={() => setCollapsed(value => !value)}
						className='cursor-pointer bg-transparent text-sm font-medium text-aw-subtle hover:text-aw-accent'
					>
						{collapsed
							? `[+] ${replies.length} ${pluralReplies(replies.length)}`
							: '[−] свернуть ветку'}
					</button>

					{!collapsed && (
						<div
							className={`mt-3 grid gap-5 ${
								depth < MAX_INDENT_DEPTH
									? 'border-l border-aw-border pl-4'
									: ''
							}`}
						>
							{shown.map(reply => (
								<CommentThread
									key={reply.id}
									comment={reply}
									repliesByParent={repliesByParent}
									depth={depth + 1}
									onReply={onReply}
									onEdit={onEdit}
									onDelete={onDelete}
								/>
							))}
							{hiddenCount > 0 && (
								<button
									type='button'
									onClick={() => setShowAll(true)}
									className='justify-self-start cursor-pointer bg-transparent text-sm font-medium text-aw-accent hover:underline'
								>
									Ещё {hiddenCount} {pluralReplies(hiddenCount)}
								</button>
							)}
						</div>
					)}
				</div>
			)}
		</CommentCard>
	)
}

function pluralReplies(n: number): string {
	const mod10 = n % 10
	const mod100 = n % 100
	if (mod10 === 1 && mod100 !== 11) return 'ответ'
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'ответа'
	return 'ответов'
}
