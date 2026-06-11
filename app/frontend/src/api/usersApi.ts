import { apiClient } from '@/api/client'
import type { AuthUser } from '@/types/auth'

/** Public user profile (no email) — visible to everyone. */
export type PublicUser = Omit<AuthUser, 'email'>

export async function getPublicUser(
	userId: number,
): Promise<PublicUser | null> {
	try {
		const response = await apiClient.get<PublicUser>(`/users/${userId}`)
		return response.data
	} catch {
		return null
	}
}
