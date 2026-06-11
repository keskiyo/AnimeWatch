import {
	AuthInput,
	FieldError,
	PasswordInput,
	SubmitButton,
} from '@/features/header/components/auth/AuthFormControls'
import { useAuthUser } from '@/features/auth/useAuthUser'
import { isAxiosError } from 'axios'
import { useState, type SyntheticEvent } from 'react'

type LoginFormProps = {
	className: string
	onSuccess: () => void
}

export function LoginForm({ className, onSuccess }: LoginFormProps) {
	const { login } = useAuthUser()
	const [loginValue, setLoginValue] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function onSubmit(event: SyntheticEvent) {
		event.preventDefault()
		if (isSubmitting) return

		if (!loginValue.trim() || !password) {
			setError('Введите логин и пароль')
			return
		}

		setIsSubmitting(true)
		setError('')
		try {
			await login(loginValue.trim(), password)
			onSuccess()
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 401) {
				setError('Неверный логин или пароль')
			} else {
				setError('Не удалось войти. Попробуйте позже.')
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form className={className} onSubmit={onSubmit} noValidate>
			<h2 className='text-center text-2xl font-black text-aw-text'>
				С возвращением!
			</h2>
			<AuthInput
				name='login'
				type='text'
				placeholder='Email или имя'
				autoComplete='username'
				value={loginValue}
				invalid={Boolean(error)}
				onChange={e => setLoginValue(e.target.value)}
			/>
			<PasswordInput
				name='password'
				placeholder='Пароль'
				autoComplete='current-password'
				value={password}
				invalid={Boolean(error)}
				onChange={e => setPassword(e.target.value)}
			/>
			<SubmitButton disabled={isSubmitting}>
				{isSubmitting ? 'Вход…' : 'Войти'}
			</SubmitButton>
			<FieldError message={error} />
		</form>
	)
}
