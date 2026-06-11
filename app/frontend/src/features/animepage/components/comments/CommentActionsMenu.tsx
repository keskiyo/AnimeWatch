import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type CommentActionsMenuProps = {
	/** The author can edit; admins can only delete other people's comments. */
	canEdit: boolean
	onEdit: () => void
	onDelete: () => void
}

export function CommentActionsMenu({
	canEdit,
	onEdit,
	onDelete,
}: CommentActionsMenuProps) {
	const [isOpen, setIsOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		function onClickDocument(event: MouseEvent) {
			if (!menuRef.current?.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}
		if (isOpen) document.addEventListener('mousedown', onClickDocument)
		return () => document.removeEventListener('mousedown', onClickDocument)
	}, [isOpen])

	return (
		<div className='relative shrink-0' ref={menuRef}>
			<button
				type='button'
				onClick={() => setIsOpen(value => !value)}
				aria-label='Действия с комментарием'
				aria-expanded={isOpen}
				className='inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-aw-subtle transition-colors hover:bg-aw-elevated hover:text-aw-text'
			>
				<EllipsisVertical size={18} aria-hidden='true' />
			</button>

			{isOpen && (
				<div className='absolute right-0 top-9 z-20 w-44 rounded-lg border border-aw-border bg-aw-header p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.4)]'>
					{canEdit && (
						<button
							type='button'
							onClick={() => {
								setIsOpen(false)
								onEdit()
							}}
							className='flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-3 py-2 text-left text-sm text-aw-text hover:bg-aw-elevated'
						>
							<Pencil size={15} aria-hidden='true' />
							Редактировать
						</button>
					)}
					<button
						type='button'
						onClick={() => {
							setIsOpen(false)
							onDelete()
						}}
						className='flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-3 py-2 text-left text-sm text-aw-accent hover:bg-aw-elevated'
					>
						<Trash2 size={15} aria-hidden='true' />
						Удалить
					</button>
				</div>
			)}
		</div>
	)
}
