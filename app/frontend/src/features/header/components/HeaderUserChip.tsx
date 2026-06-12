import { resolveAvatarUrl } from '@/api/authApi'
import { useAuthUser } from '@/features/auth/useAuthUser'
import { LogOut, User, UserCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const FALLBACK_AVATAR = '/not-image.png'

type HeaderUserChipProps = {
	variant: 'desktop' | 'menu'
	onRequestAuth: () => void
	onNavigate?: () => void
}

export function HeaderUserChip({
	variant,
	onRequestAuth,
	onNavigate,
}: HeaderUserChipProps) {
	const { user, logout } = useAuthUser()
	const [isOpen, setIsOpen] = useState(false)
	const rootRef = useRef<HTMLDivElement>(null)
	const isMenu = variant === 'menu'

	useEffect(() => {
		if (!isOpen) return

		function onMouseDown(event: MouseEvent) {
			if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
		}

		document.addEventListener('mousedown', onMouseDown)
		return () => document.removeEventListener('mousedown', onMouseDown)
	}, [isOpen])

	if (user) {
		if (isMenu) {
			return (
				<Link
					to='/profile'
					aria-label='Профиль'
					onClick={onNavigate}
					className='mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-aw-text hover:bg-aw-elevated'
				>
					<UserAvatar src={user.avatar_url} isMenu />
					<span className='truncate'>{user.name}</span>
				</Link>
			)
		}

		return (
			<div ref={rootRef} className='relative'>
				<button
					type='button'
					aria-haspopup='menu'
					aria-expanded={isOpen}
					onClick={() => setIsOpen(value => !value)}
					className='inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-aw-text transition-colors hover:text-aw-accent'
				>
					<UserAvatar src={user.avatar_url} />
					<span className='max-w-32 truncate max-[520px]:hidden'>
						{user.name}
					</span>
				</button>
				{isOpen && (
					<div className='absolute right-0 top-11 z-50 grid w-44 gap-1 rounded-md border border-aw-border bg-aw-surface p-1.5 shadow-xl'>
						<Link
							to='/profile'
							onClick={() => {
								setIsOpen(false)
								onNavigate?.()
							}}
							className='flex items-center gap-2 rounded px-3 py-2 text-sm text-aw-text no-underline hover:bg-aw-elevated'
						>
							<User size={16} aria-hidden='true' />
							Профиль
						</Link>
						<button
							type='button'
							onClick={() => {
								setIsOpen(false)
								void logout()
							}}
							className='flex cursor-pointer items-center gap-2 rounded border-0 bg-transparent px-3 py-2 text-left text-sm text-aw-text hover:bg-aw-elevated hover:text-aw-accent'
						>
							<LogOut size={16} aria-hidden='true' />
							Выйти
						</button>
					</div>
				)}
			</div>
		)
	}

	return (
		<button
			type='button'
			onClick={onRequestAuth}
			className={
				isMenu
					? 'mt-1 flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-3 py-2 text-left text-aw-subtle hover:bg-aw-elevated hover:text-aw-text'
					: 'inline-flex cursor-pointer items-center gap-1.75 border-0 bg-transparent p-0 text-aw-subtle transition-colors hover:text-aw-text'
			}
		>
			<UserCircle size={isMenu ? 19 : 24} aria-hidden='true' />
			<span className={isMenu ? '' : 'max-[520px]:hidden'}>Войти</span>
		</button>
	)
}

function UserAvatar({ src, isMenu = false }: { src?: string; isMenu?: boolean }) {
	return (
		<img
			src={resolveAvatarUrl(src) || FALLBACK_AVATAR}
			alt=''
			className={`rounded-full border border-aw-border bg-aw-elevated object-cover ${isMenu ? 'h-6 w-6' : 'h-8 w-8'}`}
			onError={event => {
				event.currentTarget.src = FALLBACK_AVATAR
			}}
		/>
	)
}
