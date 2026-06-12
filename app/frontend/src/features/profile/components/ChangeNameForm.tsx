import { apiUpdateProfile } from '@/api/authApi'
import { useAuthUser } from '@/features/auth/useAuthUser'
import {
	AuthInput,
	FieldError,
	SubmitButton,
} from '@/features/header/components/auth/AuthFormControls'
import type { AuthUser } from '@/types/auth'
import { validateName } from '@/utils/authValidation'
import { notifyError, notifySuccess } from '@/utils/notify'
import { useState, type SyntheticEvent } from 'react'

type ChangeNameFormProps = {
	user: AuthUser
}

export function ChangeNameForm({ user }: ChangeNameFormProps) {
	const { refresh } = useAuthUser()
	const [name, setName] = useState(user.name)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function onSubmit(event: SyntheticEvent) {
		event.preventDefault()
		if (isSubmitting) return
		const nameError = validateName(name)
		if (nameError) {
			setError(nameError)
			return
		}

		setIsSubmitting(true)
		setSuccess(false)
		setError('')
		try {
			await apiUpdateProfile(name.trim())
			await refresh()
			setSuccess(true)
			notifySuccess('Имя обновлено')
		} catch {
			const message = 'Не удалось изменить имя'
			setError(message)
			notifyError(message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form className='grid gap-3' onSubmit={onSubmit} noValidate>
			<h3 className='m-0 text-lg font-semibold text-aw-text'>Имя профиля</h3>
			<AuthInput
				name='name'
				placeholder='Имя'
				autoComplete='name'
				value={name}
				invalid={Boolean(error)}
				onChange={event => setName(event.target.value)}
			/>
			<SubmitButton disabled={isSubmitting || name.trim() === user.name}>
				{isSubmitting ? 'Сохранение...' : 'Сохранить имя'}
			</SubmitButton>
			<FieldError message={error} />
			{success && (
				<p className='m-0 text-sm text-aw-success'>Имя обновлено</p>
			)}
		</form>
	)
}
