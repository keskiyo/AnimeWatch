import {
	DropdownLink,
	MenuLink,
	UserAvatar,
} from '@/features/header/components/HeaderUserMenuParts'
import { useAuthUser } from '@/features/auth/useAuthUser'
import { LogOut, ShieldCheck, User, UserCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
	const isAdmin = user?.role === 'admin'

	useEffect(() => {
		if (!isOpen) return
		function onMouseDown(event: MouseEvent) {
			if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
		}
		document.addEventListener('mousedown', onMouseDown)
		return () => document.removeEventListener('mousedown', onMouseDown)
	}, [isOpen])

	if (!user) {
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

	if (isMenu) {
		return (
			<div className='grid gap-1'>
				<MenuLink to='/profile' onNavigate={onNavigate}>
					<UserAvatar src={user.avatar_url} isMenu />
					<span className='truncate'>{user.name}</span>
				</MenuLink>
				{isAdmin && (
					<MenuLink
						to='/admin'
						onNavigate={onNavigate}
						className='mt-2 border-t border-aw-border pt-3'
					>
						<ShieldCheck size={18} aria-hidden='true' />
						Панель администратора
					</MenuLink>
				)}
			</div>
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
				<div className='absolute right-0 top-11 z-50 grid w-56 gap-1 rounded-md border border-aw-border bg-aw-surface p-1.5 shadow-xl'>
					<DropdownLink to='/profile' onClick={() => setIsOpen(false)}>
						<User size={16} aria-hidden='true' />
						Профиль
					</DropdownLink>
					{isAdmin && (
						<DropdownLink
							to='/admin'
							onClick={() => setIsOpen(false)}
							className='mt-2 border-t border-aw-border pt-3'
						>
							<ShieldCheck size={16} aria-hidden='true' />
							Панель администратора
						</DropdownLink>
					)}
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
