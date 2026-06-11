import {
	apiGetMe,
	apiLogin,
	apiLogout,
	apiRegister,
	saveAuthToken,
} from '@/api/authApi'
import type { AuthUser } from '@/types/auth'
import { useEffect, useState } from 'react'

// Module-level auth state shared by every subscriber (Header, ProfilePage, …)
let currentUser: AuthUser | null = null
let isInitialized = false
let initStarted = false
const listeners = new Set<() => void>()

function notify() {
	listeners.forEach(fn => fn())
}

function setUser(user: AuthUser | null) {
	currentUser = user
	notify()
}

async function initFromToken() {
	currentUser = await apiGetMe()
	isInitialized = true
	notify()
}

/** Shared auth state: current user + login/register/logout actions. */
export function useAuthUser() {
	const [, tick] = useState(0)

	useEffect(() => {
		const fn = () => tick(n => n + 1)
		listeners.add(fn)
		if (!initStarted) {
			initStarted = true
			void initFromToken()
		}
		return () => {
			listeners.delete(fn)
		}
	}, [])

	return {
		user: currentUser,
		isInitialized,
		login,
		register,
		logout,
		refresh,
	}
}

async function login(loginValue: string, password: string): Promise<AuthUser> {
	const { token, user } = await apiLogin(loginValue, password)
	saveAuthToken(token)
	setUser(user)
	return user
}

async function register(
	name: string,
	email: string,
	password: string,
): Promise<AuthUser> {
	const { token, user } = await apiRegister(name, email, password)
	saveAuthToken(token)
	setUser(user)
	return user
}

async function logout(): Promise<void> {
	await apiLogout()
	setUser(null)
}

async function refresh(): Promise<void> {
	setUser(await apiGetMe())
}
