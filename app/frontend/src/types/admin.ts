import type { StaticPage } from '@/types/staticPage'

export type AdminUser = {
	id: string
	name: string
	email: string
	avatar_url: string
	role: 'user' | 'admin'
	created_at: string
	is_blocked: number
	blocked_at: string
	last_seen_at: string
}

export type AdminUsersResult = {
	data: AdminUser[]
	total: number
	page: number
}

export type AdminAuditLog = {
	id: string
	admin_user_id: string | null
	admin_name: string | null
	action: string
	target_type: string
	target_id: string
	metadata: Record<string, unknown>
	created_at: string
}

export type AdminAuditResult = {
	data: AdminAuditLog[]
	total: number
	page: number
}

export type AdminStaticPage = StaticPage

export type AdminStaticPagesResult = {
	data: AdminStaticPage[]
}

export type AdminComment = {
	id: string
	anime_id: number
	parent_id: string | null
	user_id: string
	username: string
	user_avatar: string
	anime_title: string
	text: string
	created_at: string
}

export type AdminCommentsResult = {
	data: AdminComment[]
	total: number
	page: number
}
