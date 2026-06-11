import { ChangeNameForm } from '@/features/profile/components/ChangeNameForm'
import { ChangePasswordForm } from '@/features/profile/components/ChangePasswordForm'
import type { AuthUser } from '@/types/auth'
import { Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type ProfileSettingsProps = {
	user: AuthUser
}

/** «Настройки» button opening a centered modal (Esc / click-outside close). */
export function ProfileSettings({ user }: ProfileSettingsProps) {
	const [isOpen, setIsOpen] = useState(false)

	// Esc + body scroll lock (same pattern as SearchModal/AuthModal)
	useEffect(() => {
		function onEscapeKey(event: KeyboardEvent) {
			if (event.key === 'Escape') setIsOpen(false)
		}
		if (isOpen) {
			document.addEventListener('keydown', onEscapeKey)
			document.body.style.overflow = 'hidden'
		}
		return () => {
			document.removeEventListener('keydown', onEscapeKey)
			document.body.style.overflow = ''
		}
	}, [isOpen])

	return (
		<>
			<button
				type='button'
				onClick={() => setIsOpen(true)}
				aria-haspopup='dialog'
				className='inline-flex w-full cursor-pointer items-center gap-2 rounded-md border border-aw-border bg-aw-elevated px-4 py-2 text-sm text-aw-text transition-colors hover:border-aw-accent hover:text-aw-accent'
			>
				<Settings size={16} aria-hidden='true' />
				Настройки
			</button>

			{isOpen && (
				<div
					role='dialog'
					aria-modal='true'
					aria-label='Настройки профиля'
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-[lbFadeIn_0.2s_ease-out]'
					onClick={() => setIsOpen(false)}
				>
					<div
						onClick={e => e.stopPropagation()}
						className='relative grid max-h-[90vh] w-150 max-w-[calc(100vw-2rem)] gap-5 overflow-y-auto rounded-lg border border-aw-border bg-aw-muted p-6'
					>
						<div className='flex items-center justify-between'>
							<h2 className='m-0 text-xl font-bold text-aw-text'>
								Настройки
							</h2>
							<button
								type='button'
								onClick={() => setIsOpen(false)}
								aria-label='Закрыть настройки'
								className='inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-aw-subtle transition-colors hover:bg-aw-elevated hover:text-aw-text'
							>
								<X size={20} aria-hidden='true' />
							</button>
						</div>
						<ChangeNameForm user={user} />
						<div className='h-px bg-aw-border' />
						<ChangePasswordForm />
					</div>
				</div>
			)}
		</>
	)
}
