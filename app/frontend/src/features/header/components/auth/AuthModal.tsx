import { LoginForm } from '@/features/header/components/auth/LoginForm'
import { SignupForm } from '@/features/header/components/auth/SignupForm'
import type { AuthModalProps, AuthMode } from '@/types/auth'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CARD_FACE =
	'absolute inset-0 flex flex-col justify-center gap-2.5 rounded-lg border-2 border-aw-border bg-aw-surface p-6 shadow-[5px_5px_0_0_var(--color-aw-accent)] [backface-visibility:hidden]'

/** Login / signup flip-card modal (opened from the «Войти» header button). */
export function AuthModal({ isOpen, onClose }: AuthModalProps) {
	const [mode, setMode] = useState<AuthMode>('login')
	const isSignup = mode === 'signup'
	const navigate = useNavigate()

	function onAuthSuccess() {
		onClose()
		navigate('/profile')
	}

	// Esc + body scroll lock (same pattern as SearchModal)
	useEffect(() => {
		function onEscapeKey(event: KeyboardEvent) {
			if (event.key === 'Escape') onClose()
		}
		if (isOpen) {
			document.addEventListener('keydown', onEscapeKey)
			document.body.style.overflow = 'hidden'
		}
		return () => {
			document.removeEventListener('keydown', onEscapeKey)
			document.body.style.overflow = ''
		}
	}, [isOpen, onClose])

	useEffect(() => {
		if (!isOpen) setMode('login')
	}, [isOpen])

	if (!isOpen) return null

	return (
		<div
			role='dialog'
			aria-modal='true'
			aria-label='Вход и регистрация'
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-[lbFadeIn_0.2s_ease-out]'
			onClick={onClose}
		>
			<div onClick={e => e.stopPropagation()}>
				{/* Mode switch: Вход ←→ Регистрация */}
				<div className='mb-7 flex items-center justify-center gap-4'>
					<ModeLabel
						active={!isSignup}
						onClick={() => setMode('login')}
					>
						Вход
					</ModeLabel>
					<button
						type='button'
						role='switch'
						aria-checked={isSignup}
						aria-label='Переключить вход/регистрацию'
						onClick={() => setMode(isSignup ? 'login' : 'signup')}
						className='relative h-5 w-12 cursor-pointer rounded-md border-2 border-aw-border bg-aw-elevated shadow-[3px_3px_0_0_rgba(0,0,0,0.45)] transition-colors aria-checked:bg-aw-accent/30'
					>
						<span
							className={`absolute -top-0.5 left-0 h-5 w-5 rounded-md border-2 border-aw-border bg-aw-accent transition-transform duration-300 ${isSignup ? 'translate-x-6' : '-translate-x-1'}`}
						/>
					</button>
					<ModeLabel
						active={isSignup}
						onClick={() => setMode('signup')}
					>
						Регистрация
					</ModeLabel>
				</div>

				{/* Flip card */}
				<div className='w-80 perspective-[1000px]'>
					<div
						className={`relative h-105 transition-transform duration-700 transform-3d ${isSignup ? 'transform-[rotateY(180deg)]' : ''}`}
					>
						{/* Front: login */}
						<LoginForm
							className={`${CARD_FACE} gap-4`}
							onSuccess={onAuthSuccess}
						/>

						{/* Back: signup (with client-side validation) */}
						<SignupForm
							className={`${CARD_FACE} transform-[rotateY(180deg)]`}
							onSuccess={onAuthSuccess}
						/>
					</div>
				</div>
			</div>

			<button
				type='button'
				onClick={onClose}
				className='absolute right-4 top-4 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-white/10 text-white transition hover:bg-white/20'
				aria-label='Закрыть'
			>
				<X size={22} aria-hidden='true' />
			</button>
		</div>
	)
}

function ModeLabel({
	active,
	onClick,
	children,
}: {
	active: boolean
	onClick: () => void
	children: string
}) {
	return (
		<button
			type='button'
			onClick={onClick}
			className={`w-28 cursor-pointer border-0 bg-transparent p-0 text-[15px] font-semibold transition-colors ${
				active
					? 'text-aw-accent underline underline-offset-4'
					: 'text-aw-subtle hover:text-aw-text'
			}`}
		>
			{children}
		</button>
	)
}
