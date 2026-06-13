import type { AdminUser } from '@/types/admin'
import { Ban, KeyRound, ShieldCheck, ShieldMinus, Undo2 } from 'lucide-react'
import type { ReactNode } from 'react'

type AdminUserActionsProps = {
	user: AdminUser
	onResetPassword: (user: AdminUser) => void
	onChangeRole: (user: AdminUser) => void
	onToggleBlock: (user: AdminUser) => void
}

export function AdminUserActions({
	user,
	onResetPassword,
	onChangeRole,
	onToggleBlock,
}: AdminUserActionsProps) {
	const isBlocked = Boolean(user.is_blocked)
	const roleIcon = user.role === 'admin' ? ShieldMinus : ShieldCheck
	const RoleIcon = roleIcon
	return (
		<div className='flex flex-wrap gap-2'>
			<ActionButton label='Пароль' onClick={() => onResetPassword(user)}>
				<KeyRound size={15} aria-hidden='true' />
			</ActionButton>
			<ActionButton label='Роль' onClick={() => onChangeRole(user)}>
				<RoleIcon size={15} aria-hidden='true' />
			</ActionButton>
			<ActionButton
				label={isBlocked ? 'Разблокировать' : 'Блокировать'}
				onClick={() => onToggleBlock(user)}
			>
				{isBlocked ? (
					<Undo2 size={15} aria-hidden='true' />
				) : (
					<Ban size={15} aria-hidden='true' />
				)}
			</ActionButton>
		</div>
	)
}

function ActionButton({
	children,
	label,
	onClick,
}: {
	children: ReactNode
	label: string
	onClick: () => void
}) {
	return (
		<button
			type='button'
			onClick={onClick}
			className='inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-aw-border bg-transparent px-3 text-aw-text hover:border-aw-accent hover:text-aw-accent'
		>
			{children}
			{label}
		</button>
	)
}
