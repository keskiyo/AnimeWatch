import { resolveAvatarUrl } from '@/api/authApi'
import { AdminUserActions } from '@/features/admin/components/AdminUserActions'
import type { AdminUser } from '@/types/admin'

type AdminUsersTableProps = {
	users: AdminUser[]
	isLoading: boolean
	onResetPassword: (user: AdminUser) => void
	onChangeRole: (user: AdminUser) => void
	onToggleBlock: (user: AdminUser) => void
}

export function AdminUsersTable(props: AdminUsersTableProps) {
	const { users, isLoading } = props
	return (
		<div className='overflow-x-auto rounded-md border border-aw-border'>
			<table className='w-full min-w-250 border-collapse text-left text-sm'>
				<thead className='bg-aw-elevated text-aw-subtle'>
					<tr>
						<th className='px-4 py-3 font-medium'>Пользователь</th>
						<th className='px-4 py-3 font-medium'>Email</th>
						<th className='px-4 py-3 font-medium'>Роль</th>
						<th className='px-4 py-3 font-medium'>Статус</th>
						<th className='px-4 py-3 font-medium'>Регистрация</th>
						<th className='px-4 py-3 font-medium'>Был на сайте</th>
						<th className='px-4 py-3 font-medium'>Действия</th>
					</tr>
				</thead>
				<tbody className='divide-y divide-aw-border bg-aw-surface'>
					{isLoading && users.length === 0 ? (
						<UserRowsSkeleton />
					) : users.length > 0 ? (
						users.map(user => <UserRow key={user.id} user={user} {...props} />)
					) : (
						<tr>
							<td colSpan={7} className='px-4 py-8 text-center text-aw-subtle'>
								Пользователи не найдены
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	)
}

function UserRow({
	user,
	onResetPassword,
	onChangeRole,
	onToggleBlock,
}: AdminUsersTableProps & { user: AdminUser }) {
	return (
		<tr className='text-aw-text'>
			<td className='px-4 py-3'>
				<div className='flex items-center gap-3'>
					<img
						src={resolveAvatarUrl(user.avatar_url) || '/not-image.png'}
						alt=''
						className='size-9 rounded-full border border-aw-border object-cover'
					/>
					<div className='min-w-0'>
						<p className='m-0 truncate font-medium'>{user.name}</p>
						<p className='m-0 text-xs text-aw-subtle'>ID {user.id}</p>
					</div>
				</div>
			</td>
			<td className='px-4 py-3 text-aw-subtle'>{user.email}</td>
			<td className='px-4 py-3'>{user.role}</td>
			<td className='px-4 py-3'>
				<span className={statusClassName(user.is_blocked)}>
					{user.is_blocked ? 'Заблокирован' : 'Активен'}
				</span>
			</td>
			<td className='px-4 py-3 text-aw-subtle'>{formatDate(user.created_at)}</td>
			<td className='px-4 py-3 text-aw-subtle'>
				{user.last_seen_at ? formatDateTime(user.last_seen_at) : 'Неизвестно'}
			</td>
			<td className='px-4 py-3'>
				<AdminUserActions
					user={user}
					onResetPassword={onResetPassword}
					onChangeRole={onChangeRole}
					onToggleBlock={onToggleBlock}
				/>
			</td>
		</tr>
	)
}

function statusClassName(isBlocked: number) {
	return `rounded px-2 py-1 text-xs ${
		isBlocked ? 'bg-aw-accent/20 text-aw-accent' : 'bg-aw-elevated text-aw-text'
	}`
}

function formatDate(value: string) {
	return new Date(value).toLocaleDateString('ru-RU')
}

function formatDateTime(value: string) {
	return new Date(value).toLocaleString('ru-RU')
}

function UserRowsSkeleton() {
	return Array.from({ length: 4 }).map((_, index) => (
		<tr key={index}>
			<td colSpan={7} className='px-4 py-3'>
				<div className='h-10 animate-pulse rounded bg-aw-elevated' />
			</td>
		</tr>
	))
}
