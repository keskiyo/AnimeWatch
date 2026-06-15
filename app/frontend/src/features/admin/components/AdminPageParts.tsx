import type { AdminComment, AdminUser } from '@/types/admin'
import { ShieldCheck } from 'lucide-react'

export type PendingAdminAction =
	| { type: 'role'; user: AdminUser }
	| { type: 'block'; user: AdminUser }
	| { type: 'delete_comment'; comment: AdminComment }
	| null

export function AdminHeader({ totalUsers }: { totalUsers: number }) {
	return (
		<div className='flex flex-wrap items-start justify-between gap-4'>
			<div className='flex items-center gap-3'>
				<span className='inline-flex size-11 items-center justify-center rounded-md bg-aw-accent/15 text-aw-accent'>
					<ShieldCheck size={24} aria-hidden='true' />
				</span>
				<div>
					<h1 className='m-0 text-3xl font-normal text-aw-text'>
						Панель администратора
					</h1>
					<p className='m-0 mt-1 text-sm text-aw-subtle'>
						Пользователи, страницы сайта и журнал действий.
					</p>
				</div>
			</div>
			<div className='rounded-md bg-aw-elevated px-4 py-2 text-sm text-aw-subtle'>
				Пользователей: {totalUsers}
			</div>
		</div>
	)
}

export function confirmDialogProps(action: Exclude<PendingAdminAction, null>) {
	if (action.type === 'delete_comment') {
		return {
			title: 'Удалить комментарий',
			message: `Удалить комментарий ${action.comment.username} (и все ответы на него)?`,
			confirmLabel: 'Удалить',
		}
	}
	const { user } = action
	if (action.type === 'role') {
		const toRole = user.role === 'admin' ? 'user' : 'admin'
		return {
			title: 'Сменить роль',
			message: `Сменить роль ${user.name} на ${toRole}?`,
			confirmLabel: 'Сменить',
		}
	}
	return {
		title: user.is_blocked ? 'Разблокировать пользователя' : 'Заблокировать пользователя',
		message: `${user.is_blocked ? 'Разблокировать' : 'Заблокировать'} ${user.name}?`,
		confirmLabel: user.is_blocked ? 'Разблокировать' : 'Заблокировать',
	}
}

export function AdminShellSkeleton() {
	return (
		<main className='mx-auto max-w-345 px-4 py-8'>
			<div className='h-72 animate-pulse rounded-lg bg-aw-surface' />
		</main>
	)
}
