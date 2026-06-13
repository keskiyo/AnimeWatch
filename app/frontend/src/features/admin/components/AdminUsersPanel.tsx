import { AdminPagination } from '@/features/admin/components/AdminPagination'
import { AdminUsersTable } from '@/features/admin/components/AdminUsersTable'
import type { AdminUser } from '@/types/admin'

type AdminUsersPanelProps = {
	search: string
	role: '' | 'user' | 'admin'
	blocked: '' | '0' | '1'
	page: number
	total: number
	status: 'loading' | 'ready' | 'error'
	users: AdminUser[]
	onSearchChange: (value: string) => void
	onRoleChange: (value: '' | 'user' | 'admin') => void
	onBlockedChange: (value: '' | '0' | '1') => void
	onPageChange: (page: number) => void
	onResetPassword: (user: AdminUser) => void
	onChangeRole: (user: AdminUser) => void
	onToggleBlock: (user: AdminUser) => void
}

export function AdminUsersPanel(props: AdminUsersPanelProps) {
	return (
		<section className='mt-6'>
			<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
				<h2 className='m-0 text-2xl font-normal text-aw-text'>Пользователи</h2>
				<div className='flex w-full flex-wrap gap-2 lg:w-auto'>
					<input
						value={props.search}
						onChange={event => props.onSearchChange(event.target.value)}
						placeholder='Поиск по id, имени или email'
						className='h-10 min-w-60 flex-1 rounded-md border border-aw-border bg-aw-elevated px-3 text-sm text-aw-text outline-none focus:border-aw-accent'
					/>
					<select
						value={props.role}
						onChange={event => props.onRoleChange(event.target.value as typeof props.role)}
						className='h-10 cursor-pointer rounded-md border border-aw-border bg-aw-elevated px-3 text-sm text-aw-text outline-none focus:border-aw-accent'
					>
						<option value=''>Все роли</option>
						<option value='user'>Пользователи</option>
						<option value='admin'>Администраторы</option>
					</select>
					<select
						value={props.blocked}
						onChange={event => props.onBlockedChange(event.target.value as typeof props.blocked)}
						className='h-10 cursor-pointer rounded-md border border-aw-border bg-aw-elevated px-3 text-sm text-aw-text outline-none focus:border-aw-accent'
					>
						<option value=''>Все статусы</option>
						<option value='0'>Активные</option>
						<option value='1'>Заблокированные</option>
					</select>
				</div>
			</div>
			{props.status === 'error' && (
				<p className='rounded-md bg-aw-muted px-4 py-3 text-sm text-aw-accent'>
					Не удалось загрузить пользователей
				</p>
			)}
			<AdminUsersTable
				users={props.users}
				isLoading={props.status === 'loading'}
				onResetPassword={props.onResetPassword}
				onChangeRole={props.onChangeRole}
				onToggleBlock={props.onToggleBlock}
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
