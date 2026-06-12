import { apiClient } from '@/api/client'
import { authHeaders } from '@/api/authApi'
import type { AdminAuditResult, AdminUsersResult } from '@/types/admin'

export type AdminUsersParams = {
	search?: string
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

export async function getAdminAudit(limit = 30): Promise<AdminAuditResult> {
	const response = await apiClient.get<AdminAuditResult>('/admin/audit', {
		params: { limit },
		headers: authHeaders(),
	})
	return response.data
}
