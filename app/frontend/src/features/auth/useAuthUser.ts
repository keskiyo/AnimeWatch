import {
	apiGetMe,
	apiLogin,
	apiLogout,
	apiRegister,
	saveAuthToken,
} from '@/api/authApi'
import type { AuthUser } from '@/types/auth'
import { useEffect } from 'react'
import { create } from 'zustand'

type AuthState = {
	user: AuthUser | null
	isInitialized: boolean
	login: (login: string, password: string) => Promise<AuthUser>
	register: (name: string, email: string, password: string) => Promise<AuthUser>
	logout: () => Promise<void>
	refresh: () => Promise<void>
}

// Shared auth state (Header, ProfilePage, comments, …). One store instance.
const useAuthStore = create<AuthState>()(set => ({
	user: null,
	isInitialized: false,
	async login(login, password) {
		const { token, user } = await apiLogin(login, password)
		saveAuthToken(token)
		set({ user })
		return user
	},
	async register(name, email, password) {
		const { token, user } = await apiRegister(name, email, password)
		saveAuthToken(token)
		set({ user })
		return user
	},
	async logout() {
		await apiLogout()
		set({ user: null })
	},
	async refresh() {
		set({ user: await apiGetMe() })
	},
}))

// Restore the session from the saved token exactly once per JS session.
let initStarted = false
async function initFromToken() {
	const user = await apiGetMe()
	useAuthStore.setState({ user, isInitialized: true })
}

export function useAuthUser() {
	const state = useAuthStore()

	useEffect(() => {
		if (!initStarted) {
			initStarted = true
			void initFromToken()
		}
	}, [])

	return state
}
