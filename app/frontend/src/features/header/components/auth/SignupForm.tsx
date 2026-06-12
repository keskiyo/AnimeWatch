import { useAuthUser } from '@/features/auth/useAuthUser'
import {
	AuthInput,
	FieldError,
	PasswordInput,
	SubmitButton,
} from '@/features/header/components/auth/AuthFormControls'
import type { SignupFormErrors, SignupFormValues } from '@/types/auth'
import {
	hasErrors,
	mapSignupApiError,
	validateSignup,
} from '@/utils/authValidation'
import { notifyError, notifySuccess } from '@/utils/notify'
import { isAxiosError } from 'axios'
import { SyntheticEvent, useState } from 'react'

const EMPTY_VALUES: SignupFormValues = { name: '', email: '', password: '' }

/** Trimmed copy used for validation and submit (password stays as typed). */
function cleaned(values: SignupFormValues): SignupFormValues {
	return {
		name: values.name.trim(),
		email: values.email.trim(),
		password: values.password,
	}
}

type SignupFormProps = {
	className: string
	onSuccess: () => void
}

export function SignupForm({ className, onSuccess }: SignupFormProps) {
	const { register } = useAuthUser()
	const [values, setValues] = useState<SignupFormValues>(EMPTY_VALUES)
	const [errors, setErrors] = useState<SignupFormErrors>({})
	const [isSubmitted, setIsSubmitted] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState('')

	function onChangeField(field: keyof SignupFormValues, value: string) {
		const next = { ...values, [field]: value }
		setValues(next)
		// After the first submit attempt errors follow the input live
		if (isSubmitted) setErrors(validateSignup(cleaned(next)))
	}

	async function onSubmit(event: SyntheticEvent) {
		event.preventDefault()
		if (isSubmitting) return // double-submit guard

		setIsSubmitted(true)
		const payload = cleaned(values)
		const nextErrors = validateSignup(payload)
		setErrors(nextErrors)
		if (hasErrors(nextErrors)) return

		setIsSubmitting(true)
		setSubmitError('')
		try {
			// Сервер валидирует повторно — клиентская проверка не защита
			const user = await register(
				payload.name,
				payload.email,
				payload.password,
			)
			notifySuccess(`Аккаунт создан — добро пожаловать, ${user.name}!`)
			onSuccess()
		} catch (err) {
			let message = 'Не удалось создать аккаунт. Попробуйте позже.'
			if (isAxiosError(err)) {
				const detail = err.response?.data?.detail as
					| { code?: string }
					| undefined
				message = mapSignupApiError(err.response?.status, detail?.code)
			}
			setSubmitError(message)
			notifyError(message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form className={className} onSubmit={onSubmit} noValidate>
			<h2 className='text-center text-2xl font-black text-aw-text'>
				Создать аккаунт
			</h2>

			<div>
				<AuthInput
					name='name'
					type='text'
					placeholder='Имя'
					autoComplete='username'
					value={values.name}
					invalid={Boolean(errors.name)}
					onChange={e => onChangeField('name', e.target.value)}
				/>
				<FieldError message={errors.name} />
			</div>

			<div>
				<AuthInput
					name='email'
					type='email'
					placeholder='Email'
					autoComplete='email'
					value={values.email}
					invalid={Boolean(errors.email)}
					onChange={e => onChangeField('email', e.target.value)}
				/>
				<FieldError message={errors.email} />
			</div>

			<div>
				<PasswordInput
					name='password'
					placeholder='Пароль'
					autoComplete='new-password'
					value={values.password}
					invalid={Boolean(errors.password)}
					onChange={e => onChangeField('password', e.target.value)}
				/>
				<FieldError message={errors.password} />
			</div>

			<SubmitButton disabled={isSubmitting}>
				{isSubmitting ? 'Отправка…' : 'Зарегистрироваться'}
			</SubmitButton>
			<FieldError message={submitError} />
		</form>
	)
}
