import { apiClient } from '@/api/client'
import { authHeaders } from '@/api/authApi'
import type {
	AdminAuditResult,
	AdminStaticPage,
	AdminStaticPagesResult,
	AdminUser,
	AdminUsersResult,
} from '@/types/admin'

export type AdminUsersParams = {
	search?: string
	role?: '' | 'user' | 'admin'
	blocked?: '' | '0' | '1'
	page?: number
	limit?: number
}

export async function getAdminUsers(
	params: AdminUsersParams = {},
): Promise<AdminUsersResult> {
	const response = await apiClient.get<AdminUsersResult>('/admin/users', {
		params,
		headers: authHeaders(),
	})
	return response.data
}

export async function resetAdminUserPassword(
	userId: number,
	password: string,
): Promise<void> {
	await apiClient.post(
		`/admin/users/${userId}/password`,
		{ password },
		{ headers: authHeaders() },
	)
}

export async function getAdminAudit(page = 1, limit = 20): Promise<AdminAuditResult> {
	const response = await apiClient.get<AdminAuditResult>('/admin/audit', {
		params: { page, limit },
		headers: authHeaders(),
	})
	return response.data
}

export async function updateAdminUserRole(
	userId: number,
	role: AdminUser['role'],
): Promise<AdminUser> {
	const response = await apiClient.patch<AdminUser>(
		`/admin/users/${userId}/role`,
		{ role },
		{ headers: authHeaders() },
	)
	return response.data
}

export async function updateAdminUserBlocked(
	userId: number,
	isBlocked: boolean,
): Promise<AdminUser> {
	const response = await apiClient.patch<AdminUser>(
		`/admin/users/${userId}/block`,
		{ is_blocked: isBlocked },
		{ headers: authHeaders() },
	)
	return response.data
}

export async function getAdminStaticPages(): Promise<AdminStaticPagesResult> {
	const response = await apiClient.get<AdminStaticPagesResult>('/admin/pages', {
		headers: authHeaders(),
	})
	return response.data
}

export async function updateAdminStaticPage(
	slug: AdminStaticPage['slug'],
	title: string,
	content: string,
): Promise<AdminStaticPage> {
	const response = await apiClient.patch<AdminStaticPage>(
		`/admin/pages/${slug}`,
		{ title, content },
		{ headers: authHeaders() },
	)
	return response.data
}
