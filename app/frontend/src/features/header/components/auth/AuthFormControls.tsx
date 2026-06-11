import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'

const INPUT_CLASS =
	'h-10 w-full rounded-md border-2 bg-aw-elevated px-3 text-[15px] font-medium text-aw-text shadow-[3px_3px_0_0_rgba(0,0,0,0.45)] outline-none transition-colors placeholder:text-aw-subtle focus:border-aw-accent'

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
	invalid?: boolean
}

export function AuthInput({ invalid, className, ...props }: AuthInputProps) {
	return (
		<input
			{...props}
			aria-invalid={invalid || undefined}
			className={`${INPUT_CLASS} ${invalid ? 'border-aw-accent' : 'border-aw-border'} ${className ?? ''}`}
		/>
	)
}

/** Password input with a show/hide toggle. */
export function PasswordInput({ invalid, ...props }: AuthInputProps) {
	const [isVisible, setIsVisible] = useState(false)

	return (
		<div className='relative'>
			<AuthInput
				{...props}
				invalid={invalid}
				type={isVisible ? 'text' : 'password'}
				className='pr-10'
			/>
			<button
				type='button'
				onClick={() => setIsVisible(v => !v)}
				className='absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0 text-aw-subtle transition-colors hover:text-aw-text'
				aria-label={isVisible ? 'Скрыть пароль' : 'Показать пароль'}
			>
				{isVisible ? (
					<EyeOff size={18} aria-hidden='true' />
				) : (
					<Eye size={18} aria-hidden='true' />
				)}
			</button>
		</div>
	)
}

/** Fixed-height error line under an input — no layout shift when it appears. */
export function FieldError({ message }: { message?: string }) {
	return (
		<span
			role={message ? 'alert' : undefined}
			className='block min-h-4 text-left text-xs leading-4 text-aw-accent'
		>
			{message}
		</span>
	)
}

export function SubmitButton({
	children,
	disabled,
}: {
	children: string
	disabled?: boolean
}) {
	return (
		<button
			type='submit'
			disabled={disabled}
			className='mx-auto mt-1 h-10 w-50 cursor-pointer rounded-md border-2 border-aw-border bg-aw-accent text-[15px] font-semibold text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.45)] transition active:translate-x-0.75 active:translate-y-0.75 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0_0_rgba(0,0,0,0.45)]'
		>
			{children}
		</button>
	)
}
