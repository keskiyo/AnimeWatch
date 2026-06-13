import {
	resetAdminUserPassword,
	updateAdminStaticPage,
	updateAdminUserBlocked,
	updateAdminUserRole,
} from '@/api/adminApi'
import { AdminAuditPanel } from '@/features/admin/components/AdminAuditPanel'
import { AdminCommentsPlaceholder } from '@/features/admin/components/AdminCommentsPlaceholder'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminPagesPanel } from '@/features/admin/components/AdminPagesPanel'
import { AdminPagination } from '@/features/admin/components/AdminPagination'
import {
	AdminHeader,
	AdminShellSkeleton,
	confirmDialogProps,
	type PendingAdminAction,
} from '@/features/admin/components/AdminPageParts'
import { AdminPasswordResetModal } from '@/features/admin/components/AdminPasswordResetModal'
import { AdminTabs, type AdminTab } from '@/features/admin/components/AdminTabs'
import { AdminUsersPanel } from '@/features/admin/components/AdminUsersPanel'
import { useAdminAudit } from '@/features/admin/hooks/useAdminAudit'
import { useAdminStaticPages } from '@/features/admin/hooks/useAdminStaticPages'
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers'
import { useAuthUser } from '@/features/auth/useAuthUser'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import type { AdminStaticPage, AdminUser } from '@/types/admin'
import { notifyError, notifySuccess } from '@/utils/notify'
import { setPageMeta } from '@/utils/pageMeta'
import { useEffect, useState } from 'react'

export function AdminPage() {
	const { user, isInitialized } = useAuthUser()
	useEffect(() => {
		setPageMeta({ title: 'Админ-панель — AnimeWatch', noindex: true })
	}, [])
	const [tab, setTab] = useState<AdminTab>('users')
	const [search, setSearch] = useState('')
	const [role, setRole] = useState<'' | 'user' | 'admin'>('')
	const [blocked, setBlocked] = useState<'' | '0' | '1'>('')
	const [usersPage, setUsersPage] = useState(1)
	const [auditPage, setAuditPage] = useState(1)
	const [resetUser, setResetUser] = useState<AdminUser | null>(null)
	const [pendingAction, setPendingAction] = useState<PendingAdminAction>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [refreshKey, setRefreshKey] = useState(0)
	const isAdmin = user?.role === 'admin'
	const enabled = Boolean(isInitialized && isAdmin)
	const users = useAdminUsers(search, role, blocked, usersPage, enabled, refreshKey)
	const audit = useAdminAudit(enabled, auditPage, refreshKey)
	const pages = useAdminStaticPages(enabled, refreshKey)
	const changeSearch = (value: string) => withUsersPageReset(() => setSearch(value))
	const changeRole = (value: typeof role) => withUsersPageReset(() => setRole(value))
	const changeBlocked = (value: typeof blocked) => withUsersPageReset(() => setBlocked(value))

	if (!isInitialized) return <AdminShellSkeleton />
	if (!user || !isAdmin) return <NotFoundPage />

	return (
		<main className='mx-auto max-w-345 px-4 py-8'>
			<section className='rounded-lg border border-aw-border bg-aw-surface p-6'>
				<AdminHeader totalUsers={users.total} />
				<AdminTabs activeTab={tab} onChange={setTab} />
				{tab === 'users' && (
					<AdminUsersPanel
						search={search}
						role={role}
						blocked={blocked}
						page={users.page}
						total={users.total}
						status={users.status}
						users={users.users}
						onSearchChange={changeSearch}
						onRoleChange={changeRole}
						onBlockedChange={changeBlocked}
						onPageChange={setUsersPage}
						onResetPassword={setResetUser}
						onChangeRole={selected => setPendingAction({ type: 'role', user: selected })}
						onToggleBlock={selected => setPendingAction({ type: 'block', user: selected })}
					/>
				)}
				{tab === 'pages' && (
					<AdminPagesPanel
						pages={pages.pages}
						isLoading={pages.status === 'loading'}
						isError={pages.status === 'error'}
						isSaving={isSubmitting}
						onSave={handleSavePage}
					/>
				)}
				{tab === 'audit' && (
					<>
						<AdminAuditPanel
							logs={audit.logs}
							isLoading={audit.status === 'loading'}
							isError={audit.status === 'error'}
						/>
						<AdminPagination page={audit.page} total={audit.total} limit={20} onPageChange={setAuditPage} />
					</>
				)}
				{tab === 'comments' && <AdminCommentsPlaceholder />}
			</section>
			{resetUser && <AdminPasswordResetModal user={resetUser} isSubmitting={isSubmitting} onClose={() => setResetUser(null)} onSubmit={handleResetPassword} />}
			{pendingAction && <AdminConfirmDialog {...confirmDialogProps(pendingAction)} isSubmitting={isSubmitting} onClose={() => setPendingAction(null)} onConfirm={handleConfirmAction} />}
		</main>
	)
	async function handleResetPassword(password: string) {
		if (!resetUser) return
		await submitAction(async () => {
			await resetAdminUserPassword(resetUser.id, password)
			setResetUser(null)
			notifySuccess('Пароль пользователя изменён')
		})
	}
	async function handleSavePage(page: AdminStaticPage, title: string, content: string) {
		await submitAction(async () => {
			await updateAdminStaticPage(page.slug, title, content)
			notifySuccess('Страница сохранена')
		})
	}
	async function handleConfirmAction() {
		if (!pendingAction) return
		await submitAction(async () => {
			const { user: target } = pendingAction
			if (pendingAction.type === 'role') {
				await updateAdminUserRole(target.id, target.role === 'admin' ? 'user' : 'admin')
			} else {
				await updateAdminUserBlocked(target.id, !target.is_blocked)
			}
			setPendingAction(null)
			notifySuccess('Пользователь обновлён')
		})
	}

	async function submitAction(action: () => Promise<void>) {
		setIsSubmitting(true)
		try {
			await action()
			setRefreshKey(key => key + 1)
		} catch {
			notifyError('Не удалось выполнить действие')
		} finally {
			setIsSubmitting(false)
		}
	}
	function withUsersPageReset(action: () => void) {
		action()
		setUsersPage(1)
	}
}
