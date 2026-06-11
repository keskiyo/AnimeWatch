import { apiChangePassword } from '@/api/authApi'
import {
	FieldError,
	PasswordInput,
	SubmitButton,
} from '@/features/header/components/auth/AuthFormControls'
import { validatePassword } from '@/utils/authValidation'
import { notifySuccess } from '@/utils/notify'
import { isAxiosError } from 'axios'
import { useState, type SyntheticEvent } from 'react'

export function ChangePasswordForm() {
	const [oldPassword, setOldPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [error, setError] = useState('')
	const [success, setSuccess] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function onSubmit(event: SyntheticEvent) {
		event.preventDefault()
		if (isSubmitting) return

		setSuccess(false)
		const passwordError = !oldPassword
			? 'Введите текущий пароль'
			: validatePassword(newPassword)
		if (passwordError) {
			setError(passwordError)
			return
		}

		setIsSubmitting(true)
		setError('')
		try {
			await apiChangePassword(oldPassword, newPassword)
			setSuccess(true)
			notifySuccess('Пароль обновлён')
			setOldPassword('')
			setNewPassword('')
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 401) {
				setError('Текущий пароль неверен')
			} else {
				setError('Не удалось сменить пароль. Попробуйте позже.')
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form className='grid w-full gap-3' onSubmit={onSubmit} noValidate>
			<h2 className='text-xl font-bold text-aw-text'>Смена пароля</h2>
			<PasswordInput
				name='old_password'
				placeholder='Текущий пароль'
				autoComplete='current-password'
				value={oldPassword}
				invalid={Boolean(error)}
				onChange={e => setOldPassword(e.target.value)}
			/>
			<PasswordInput
				name='new_password'
				placeholder='Новый пароль (мин. 8 символов)'
				autoComplete='new-password'
				value={newPassword}
				invalid={Boolean(error)}
				onChange={e => setNewPassword(e.target.value)}
			/>
			<SubmitButton disabled={isSubmitting}>
				{isSubmitting ? 'Сохранение…' : 'Сменить пароль'}
			</SubmitButton>
			<FieldError message={error} />
			{success && (
				<p className='m-0 text-sm text-aw-success'>Пароль обновлён ✓</p>
			)}
		</form>
	)
}
