export type AuthModalProps = {
	isOpen: boolean
	onClose: () => void
}

export type AuthMode = 'login' | 'signup'

export type SignupFormValues = {
	name: string
	email: string
	password: string
}

export type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>

export type AuthUser = {
	id: string
	name: string
	email: string
	avatar_url: string
	role: 'user' | 'admin'
	created_at: string
}

export type AuthResponse = {
	token: string
	user: AuthUser
}
