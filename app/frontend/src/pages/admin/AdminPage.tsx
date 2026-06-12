import { resetAdminUserPassword } from '@/api/adminApi'
import { AdminAuditPanel } from '@/features/admin/components/AdminAuditPanel'
import { AdminPasswordResetModal } from '@/features/admin/components/AdminPasswordResetModal'
import { useAuthUser } from '@/features/auth/useAuthUser'
import { AdminUsersTable } from '@/features/admin/components/AdminUsersTable'
import { useAdminAudit } from '@/features/admin/hooks/useAdminAudit'
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import type { AdminUser } from '@/types/admin'
import { notifyError, notifySuccess } from '@/utils/notify'
import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'

export function AdminPage() {
	const { user, isInitialized } = useAuthUser()
	const [search, setSearch] = useState('')
	const [resetUser, setResetUser] = useState<AdminUser | null>(null)
	const [isResetting, setIsResetting] = useState(false)
	const [auditRefreshKey, setAuditRefreshKey] = useState(0)
	const isAdmin = user?.role === 'admin'
	const users = useAdminUsers(search, Boolean(isInitialized && isAdmin))
	const audit = useAdminAudit(Boolean(isInitialized && isAdmin), auditRefreshKey)

	async function handleResetPassword(password: string) {
		if (!resetUser) return
		setIsResetting(true)
		try {
			await resetAdminUserPassword(resetUser.id, password)
			notifySuccess('Пароль пользователя изменён')
			setResetUser(null)
			setAuditRefreshKey(key => key + 1)
		} catch {
			notifyError('Не удалось изменить пароль')
		} finally {
			setIsResetting(false)
		}
	}

	if (!isInitialized) {
		return <AdminShellSkeleton />
	}

	if (!user || !isAdmin) {
		return (
			<NotFoundPage
				title='Страница не найдена'
				message='Такой страницы нет в каталоге или она ещё не загружена.'
			/>
		)
	}

	return (
		<main className='mx-auto max-w-345 px-4 py-8'>
			<section className='rounded-lg border border-aw-border bg-aw-surface p-6'>
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
								Пользователи, комментарии и страницы сайта.
							</p>
						</div>
					</div>
					<div className='rounded-md bg-aw-elevated px-4 py-2 text-sm text-aw-subtle'>
						Пользователей: {users.total}
					</div>
				</div>

				<div className='mt-7'>
					<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
						<h2 className='m-0 text-2xl font-normal text-aw-text'>
							Пользователи
						</h2>
						<input
							value={search}
							onChange={event => setSearch(event.target.value)}
							placeholder='Поиск по id, имени или email'
							className='h-10 w-full max-w-90 rounded-md border border-aw-border bg-aw-elevated px-3 text-sm text-aw-text outline-none focus:border-aw-accent'
						/>
					</div>
					{users.status === 'error' && (
						<p className='rounded-md bg-aw-muted px-4 py-3 text-sm text-aw-accent'>
							Не удалось загрузить пользователей
						</p>
					)}
					<div className='overflow-x-auto'>
						<AdminUsersTable
							users={users.users}
							isLoading={users.status === 'loading'}
							onResetPassword={setResetUser}
						/>
					</div>
				</div>
				<AdminAuditPanel
					logs={audit.logs}
					isLoading={audit.status === 'loading'}
					isError={audit.status === 'error'}
				/>
			</section>
			{resetUser && (
				<AdminPasswordResetModal
					user={resetUser}
					isSubmitting={isResetting}
					onClose={() => setResetUser(null)}
					onSubmit={handleResetPassword}
				/>
			)}
		</main>
	)
}

function AdminShellSkeleton() {
	return (
		<main className='mx-auto max-w-345 px-4 py-8'>
			<div className='h-72 animate-pulse rounded-lg bg-aw-surface' />
		</main>
	)
}
