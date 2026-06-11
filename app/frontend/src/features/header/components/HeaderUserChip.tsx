import { resolveAvatarUrl } from '@/api/authApi'
import { useAuthUser } from '@/features/auth/useAuthUser'
import { UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const FALLBACK_AVATAR = '/not-image.png'

type HeaderUserChipProps = {
	/** 'desktop' — icon chip in the top bar, 'menu' — row in the mobile menu */
	variant: 'desktop' | 'menu'
	onRequestAuth: () => void
	onNavigate?: () => void
}

/** Avatar + name linking to /profile, or the «Войти» button when logged out. */
export function HeaderUserChip({
	variant,
	onRequestAuth,
	onNavigate,
}: HeaderUserChipProps) {
	const { user } = useAuthUser()
	const isMenu = variant === 'menu'

	if (user) {
		return (
			<Link
				to='/profile'
				aria-label='Профиль'
				onClick={onNavigate}
				className={
					isMenu
						? 'mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-aw-text hover:bg-aw-elevated'
						: 'inline-flex items-center gap-2 text-aw-text no-underline transition-colors hover:text-aw-accent'
				}
			>
				<img
					src={resolveAvatarUrl(user.avatar_url) || FALLBACK_AVATAR}
					alt=''
					className={`rounded-full border border-aw-border bg-aw-elevated object-cover ${isMenu ? 'h-6 w-6' : 'h-8 w-8'}`}
					onError={e => {
						e.currentTarget.src = FALLBACK_AVATAR
					}}
				/>
				<span
					className={
						isMenu ? 'truncate' : 'max-w-32 truncate max-[520px]:hidden'
					}
				>
					{user.name}
				</span>
			</Link>
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
