import { resolveAvatarUrl } from '@/api/authApi'
import type { AdminComment } from '@/types/admin'
import { Trash2 } from 'lucide-react'

type AdminCommentsTableProps = {
	comments: AdminComment[]
	isLoading: boolean
	onDelete: (comment: AdminComment) => void
}

export function AdminCommentsTable({
	comments,
	isLoading,
	onDelete,
}: AdminCommentsTableProps) {
	return (
		<div className='overflow-x-auto rounded-md border border-aw-border'>
			<table className='w-full min-w-250 border-collapse text-left text-sm'>
				<thead className='bg-aw-elevated text-aw-subtle'>
					<tr>
						<th className='px-4 py-3 font-medium'>Автор</th>
						<th className='px-4 py-3 font-medium'>Аниме</th>
						<th className='px-4 py-3 font-medium'>Комментарий</th>
						<th className='px-4 py-3 font-medium'>Дата</th>
						<th className='px-4 py-3 font-medium'>Действия</th>
					</tr>
				</thead>
				<tbody className='divide-y divide-aw-border bg-aw-surface'>
					{isLoading && comments.length === 0 ? (
						<RowsSkeleton />
					) : comments.length > 0 ? (
						comments.map(comment => (
							<CommentRow
								key={comment.id}
								comment={comment}
								onDelete={onDelete}
							/>
						))
					) : (
						<tr>
							<td
								colSpan={5}
								className='px-4 py-8 text-center text-aw-subtle'
							>
								Комментариев нет
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	)
}

function CommentRow({
	comment,
	onDelete,
}: {
	comment: AdminComment
	onDelete: (comment: AdminComment) => void
}) {
	return (
		<tr className='text-aw-text'>
			<td className='px-4 py-3'>
				<div className='flex items-center gap-3'>
					<img
						src={resolveAvatarUrl(comment.user_avatar) || '/not-image.png'}
						alt=''
						className='size-9 rounded-full border border-aw-border object-cover'
					/>
					<div className='min-w-0'>
						<p className='m-0 truncate font-medium'>{comment.username}</p>
						<p className='m-0 text-xs text-aw-subtle'>ID {comment.user_id}</p>
					</div>
				</div>
			</td>
			<td className='px-4 py-3 text-aw-subtle'>
				{comment.anime_title || `#${comment.anime_id}`}
				{comment.parent_id ? ' · ответ' : ''}
			</td>
			<td className='max-w-100 px-4 py-3'>
				<p className='m-0 line-clamp-3 wrap-break-word'>{comment.text}</p>
			</td>
			<td className='px-4 py-3 text-aw-subtle'>
				{new Date(comment.created_at).toLocaleString('ru-RU')}
			</td>
			<td className='px-4 py-3'>
				<button
					type='button'
					onClick={() => onDelete(comment)}
					className='inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-aw-border px-3 py-1.5 text-sm text-aw-accent hover:bg-aw-elevated'
				>
					<Trash2 size={15} aria-hidden='true' />
					Удалить
				</button>
			</td>
		</tr>
	)
}

function RowsSkeleton() {
	return Array.from({ length: 4 }).map((_, index) => (
		<tr key={index}>
			<td colSpan={5} className='px-4 py-3'>
				<div className='h-10 animate-pulse rounded bg-aw-elevated' />
			</td>
		</tr>
	))
}
