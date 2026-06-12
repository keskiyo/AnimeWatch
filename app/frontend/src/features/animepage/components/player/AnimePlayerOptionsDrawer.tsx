import { AnimePlayerSidebar } from '@/features/animepage/components/player/AnimePlayerSidebar'
import type { AnimePlayerSidebarProps } from '@/types/animePage'
import { X } from 'lucide-react'

type AnimePlayerOptionsDrawerProps = AnimePlayerSidebarProps & {
	isOpen: boolean
	onClose: () => void
}

export function AnimePlayerOptionsDrawer({
	isOpen,
	onClose,
	...sidebarProps
}: AnimePlayerOptionsDrawerProps) {
	if (!isOpen) return null

	return (
		<div className='fixed inset-0 z-50 min-[761px]:hidden'>
			<button
				type='button'
				aria-label='Закрыть выбор озвучки'
				onClick={onClose}
				className='absolute inset-0 cursor-pointer bg-black/55'
			/>
			<aside className='absolute bottom-0 right-0 top-0 w-[min(82vw,320px)] border-l border-aw-border bg-aw-surface p-4 shadow-2xl'>
				<div className='mb-8 flex items-center justify-between gap-3'>
					<h3 className='m-0 text-lg font-normal text-aw-text'>
						Выберите озвучку и плеер
					</h3>
					<button
						type='button'
						onClick={onClose}
						aria-label='Закрыть'
						className='inline-flex size-8 cursor-pointer items-center justify-center rounded text-aw-subtle hover:bg-aw-elevated hover:text-aw-text'
					>
						<X size={22} aria-hidden='true' />
					</button>
				</div>
				<AnimePlayerSidebar {...sidebarProps} />
			</aside>
		</div>
	)
}
