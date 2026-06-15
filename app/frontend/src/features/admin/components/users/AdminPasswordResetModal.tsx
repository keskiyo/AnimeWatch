import type { AdminUser } from '@/types/admin'
import { X } from 'lucide-react'
import { SyntheticEvent, useState } from 'react'

type AdminPasswordResetModalProps = {
	user: AdminUser
	isSubmitting: boolean
	onClose: () => void
	onSubmit: (password: string) => Promise<void>
}

export function AdminPasswordResetModal({
	user,
	isSubmitting,
	onClose,
	onSubmit,
}: AdminPasswordResetModalProps) {
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')

	async function handleSubmit(event: SyntheticEvent) {
		event.preventDefault()
		if (password.trim().length < 8) {
			setError('Пароль должен быть не короче 8 символов')
			return
		}
		setError('')
		await onSubmit(password)
	}

	return (
		<div className='fixed inset-0 z-60 flex items-center justify-center bg-black/60 px-4'>
			<form
				onSubmit={handleSubmit}
				className='w-full max-w-105 rounded-lg border border-aw-border bg-aw-surface p-5 shadow-2xl'
			>
				<div className='flex items-start justify-between gap-4'>
					<div>
						<h2 className='m-0 text-xl font-normal text-aw-text'>
							Сменить пароль
						</h2>
						<p className='m-0 mt-1 text-sm text-aw-subtle'>
							Пользователь: {user.name}
						</p>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='inline-flex size-8 cursor-pointer items-center justify-center rounded text-aw-subtle hover:bg-aw-elevated hover:text-aw-text'
						aria-label='Закрыть'
					>
						<X size={20} aria-hidden='true' />
					</button>
				</div>
				<label className='mt-5 block text-sm text-aw-subtle'>
					Новый временный пароль
					<input
						value={password}
						onChange={event => setPassword(event.target.value)}
						type='password'
						className='mt-2 h-10 w-full rounded-md border border-aw-border bg-aw-elevated px-3 text-aw-text outline-none focus:border-aw-accent'
					/>
				</label>
				<p className='mt-2 min-h-5 text-sm text-aw-accent'>{error}</p>
				<div className='mt-4 flex justify-end gap-3'>
					<button
						type='button'
						onClick={onClose}
						className='h-10 cursor-pointer rounded-md border border-aw-border bg-transparent px-4 text-aw-text hover:bg-aw-elevated'
					>
						Отмена
					</button>
					<button
						type='submit'
						disabled={isSubmitting}
						className='h-10 cursor-pointer rounded-md border-0 bg-aw-accent px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60'
					>
						Сохранить
					</button>
				</div>
			</form>
		</div>
	)
}
