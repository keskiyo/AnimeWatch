import { resolveAvatarUrl } from '@/api/authApi'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const FALLBACK_AVATAR = '/not-image.png'

type LinkProps = {
	to: string
	className?: string
	children: ReactNode
}

type DropdownLinkProps = LinkProps & {
	onClick: () => void
}

type MenuLinkProps = LinkProps & {
	onNavigate?: () => void
}

export function DropdownLink({
	to,
	onClick,
	className = '',
	children,
}: DropdownLinkProps) {
	return (
		<Link
			to={to}
			onClick={onClick}
			className={`flex items-center gap-2 rounded px-3 py-2 text-sm text-aw-text no-underline hover:bg-aw-elevated ${className}`}
		>
			{children}
		</Link>
	)
}

export function MenuLink({
	to,
	onNavigate,
	className = '',
	children,
}: MenuLinkProps) {
	return (
		<Link
			to={to}
			onClick={onNavigate}
			className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-aw-text no-underline hover:bg-aw-elevated ${className}`}
		>
			{children}
		</Link>
	)
}

export function UserAvatar({
	src,
	isMenu = false,
}: {
	src?: string
	isMenu?: boolean
}) {
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
