import { apiClient } from '@/api/client'
import type { AuthResponse, AuthUser } from '@/types/auth'

const TOKEN_KEY = 'aw_auth_token'

export function getAuthToken(): string | null {
	return localStorage.getItem(TOKEN_KEY)
}

export function saveAuthToken(token: string): void {
	localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken(): void {
	localStorage.removeItem(TOKEN_KEY)
}

function authHeaders() {
	const token = getAuthToken()
	return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiRegister(
	name: string,
	email: string,
	password: string,
): Promise<AuthResponse> {
	const response = await apiClient.post<AuthResponse>('/auth/register', {
		name,
		email,
		password,
	})
	return response.data
}

export async function apiLogin(
	login: string,
	password: string,
): Promise<AuthResponse> {
	const response = await apiClient.post<AuthResponse>('/auth/login', {
		login,
		password,
	})
	return response.data
}

export async function apiGetMe(): Promise<AuthUser | null> {
	if (!getAuthToken()) return null
	try {
		const response = await apiClient.get<AuthUser>('/auth/me', {
			headers: authHeaders(),
		})
		return response.data
	} catch {
		clearAuthToken() // expired/invalid session
		return null
	}
}

export async function apiLogout(): Promise<void> {
	try {
		await apiClient.post('/auth/logout', null, { headers: authHeaders() })
	} finally {
		clearAuthToken()
	}
}

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

/** Backend avatar URLs are relative ("/api/avatars/1") — prepend the origin. */
export function resolveAvatarUrl(url: string | undefined | null): string {
	if (!url) return ''
	return url.startsWith('/') ? `${BACKEND_ORIGIN}${url}` : url
}

export async function apiUploadAvatar(file: File): Promise<string> {
	const form = new FormData()
	form.append('file', file)
	const response = await apiClient.post<{ avatar_url: string }>(
		'/auth/avatar',
		form,
		{ headers: authHeaders() },
	)
	return response.data.avatar_url
}

export async function apiChangePassword(
	oldPassword: string,
	newPassword: string,
): Promise<void> {
	await apiClient.post(
		'/auth/change-password',
		{ old_password: oldPassword, new_password: newPassword },
		{ headers: authHeaders() },
	)
}
