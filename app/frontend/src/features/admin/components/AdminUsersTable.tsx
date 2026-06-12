import { resolveAvatarUrl } from '@/api/authApi'
import type { AdminUser } from '@/types/admin'
import { KeyRound } from 'lucide-react'

type AdminUsersTableProps = {
	users: AdminUser[]
	isLoading: boolean
	onResetPassword: (user: AdminUser) => void
}

export function AdminUsersTable({
	users,
	isLoading,
	onResetPassword,
}: AdminUsersTableProps) {
	return (
		<div className='overflow-hidden rounded-md border border-aw-border'>
			<table className='w-full border-collapse text-left text-sm'>
				<thead className='bg-aw-elevated text-aw-subtle'>
					<tr>
						<th className='px-4 py-3 font-medium'>Пользователь</th>
						<th className='px-4 py-3 font-medium'>Email</th>
						<th className='px-4 py-3 font-medium'>Роль</th>
						<th className='px-4 py-3 font-medium'>Регистрация</th>
						<th className='px-4 py-3 font-medium'>Действия</th>
					</tr>
				</thead>
				<tbody className='divide-y divide-aw-border bg-aw-surface'>
					{isLoading && users.length === 0 ? (
						<UserRowsSkeleton />
					) : users.length > 0 ? (
						users.map(user => (
							<UserRow
								key={user.id}
								user={user}
								onResetPassword={onResetPassword}
							/>
						))
					) : (
						<tr>
							<td
								colSpan={5}
								className='px-4 py-8 text-center text-aw-subtle'
							>
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
}: {
	user: AdminUser
	onResetPassword: (user: AdminUser) => void
}) {
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
			<td className='px-4 py-3'>
				<span className='rounded bg-aw-elevated px-2 py-1 text-xs text-aw-text'>
					{user.role}
				</span>
			</td>
			<td className='px-4 py-3 text-aw-subtle'>
				{new Date(user.created_at).toLocaleDateString('ru-RU')}
			</td>
			<td className='px-4 py-3'>
				<button
					type='button'
					onClick={() => onResetPassword(user)}
					className='inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-aw-border bg-transparent px-3 text-aw-text hover:border-aw-accent hover:text-aw-accent'
				>
					<KeyRound size={16} aria-hidden='true' />
					Пароль
				</button>
			</td>
		</tr>
	)
}

function UserRowsSkeleton() {
	return Array.from({ length: 4 }).map((_, index) => (
		<tr key={index}>
			<td colSpan={5} className='px-4 py-3'>
				<div className='h-10 animate-pulse rounded bg-aw-elevated' />
			</td>
		</tr>
	))
}
