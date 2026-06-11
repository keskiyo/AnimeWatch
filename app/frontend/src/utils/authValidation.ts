import type { SignupFormErrors, SignupFormValues } from '@/types/auth'

// Cyrillic/Latin letters, spaces, hyphens, apostrophes
const NAME_RE = /^[A-Za-zА-Яа-яЁё' -]+$/
// Basic shape check — the server stays the real validator
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateName(raw: string): string | undefined {
	const name = raw.trim()
	if (!name) return 'Введите имя'
	if (name.length < 2) return 'Имя слишком короткое'
	if (name.length > 50) return 'Имя слишком длинное'
	if (!NAME_RE.test(name)) return 'Имя содержит недопустимые символы'
	return undefined
}

export function validateEmail(raw: string): string | undefined {
	const email = raw.trim()
	if (!email) return 'Введите email'
	if (!EMAIL_RE.test(email)) return 'Некорректный email'
	return undefined
}

export function validatePassword(raw: string): string | undefined {
	// Password is NOT trimmed — but spaces-only means empty
	if (!raw || !raw.trim()) return 'Введите пароль'
	if (raw.length < 8) return 'Пароль должен быть не короче 8 символов'
	if (raw.length > 128) return 'Пароль слишком длинный'
	return undefined
}

/** Validate the whole signup form. Returns only the fields that failed. */
export function validateSignup(values: SignupFormValues): SignupFormErrors {
	const errors: SignupFormErrors = {}
	const name = validateName(values.name)
	const email = validateEmail(values.email)
	const password = validatePassword(values.password)
	if (name) errors.name = name
	if (email) errors.email = email
	if (password) errors.password = password
	return errors
}

export function hasErrors(errors: SignupFormErrors): boolean {
	return Object.keys(errors).length > 0
}

/** Map a backend signup error to a user-readable message (no tech details). */
export function mapSignupApiError(status?: number, code?: string): string {
	if (status === 409 || code === 'email_taken') {
		return 'Пользователь с таким email уже зарегистрирован'
	}
	return 'Не удалось создать аккаунт. Попробуйте позже.'
}
