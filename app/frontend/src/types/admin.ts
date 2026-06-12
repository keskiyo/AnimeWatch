export type AdminUser = {
	id: number
	name: string
	email: string
	avatar_url: string
	role: 'user' | 'admin'
	created_at: string
}

export type AdminUsersResult = {
	data: AdminUser[]
	total: number
	page: number
}

export type AdminAuditLog = {
	id: number
	admin_user_id: number
	admin_name: string | null
	action: string
	target_type: string
	target_id: string
	metadata_json: string
	created_at: string
}

export type AdminAuditResult = {
	data: AdminAuditLog[]
}
