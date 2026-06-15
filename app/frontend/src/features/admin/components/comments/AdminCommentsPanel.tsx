import { AdminCommentsTable } from '@/features/admin/components/comments/AdminCommentsTable'
import { AdminPagination } from '@/features/admin/components/AdminPagination'
import type { AdminComment } from '@/types/admin'

type AdminCommentsPanelProps = {
	comments: AdminComment[]
	page: number
	total: number
	status: 'loading' | 'ready' | 'error'
	onPageChange: (page: number) => void
	onDelete: (comment: AdminComment) => void
}

export function AdminCommentsPanel(props: AdminCommentsPanelProps) {
	return (
		<section className='mt-6'>
			<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
				<h2 className='m-0 text-2xl font-normal text-aw-text'>Комментарии</h2>
				<span className='rounded-md bg-aw-elevated px-3 py-1.5 text-sm text-aw-subtle'>
					Всего: {props.total}
				</span>
			</div>
			{props.status === 'error' && (
				<p className='rounded-md bg-aw-muted px-4 py-3 text-sm text-aw-accent'>
					Не удалось загрузить комментарии
				</p>
			)}
			<AdminCommentsTable
				comments={props.comments}
				isLoading={props.status === 'loading'}
				onDelete={props.onDelete}
			/>
			<AdminPagination
				page={props.page}
				total={props.total}
				limit={20}
				onPageChange={props.onPageChange}
			/>
		</section>
	)
}
