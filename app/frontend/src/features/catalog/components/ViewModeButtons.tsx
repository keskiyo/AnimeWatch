import type { CatalogViewMode } from '@/types/catalog'
import { CATALOG_VIEW_MODES } from '@/utils/catalogData'
import { Grip, LayoutGrid, List } from 'lucide-react'

const VIEW_ICONS = {
	poster: Grip,
	compact: LayoutGrid,
	list: List,
} as const

type ViewModeButtonsProps = {
	viewMode: CatalogViewMode
	onChange: (mode: CatalogViewMode) => void
}

export function ViewModeButtons({
	viewMode,
	onChange,
}: ViewModeButtonsProps) {
	return (
		<div className='flex items-center gap-3' aria-label='Режим отображения'>
			{CATALOG_VIEW_MODES.map(mode => {
				const Icon = VIEW_ICONS[mode.id]

				return (
					<button
						key={mode.id}
						type='button'
						className={`inline-flex cursor-pointer border-0 bg-transparent p-0 transition-colors hover:text-aw-accent ${
							mode.id === viewMode ? 'text-aw-accent' : 'text-aw-icon'
						}`}
						aria-label={mode.label}
						aria-pressed={mode.id === viewMode}
						onClick={() => onChange(mode.id)}
					>
						<Icon
							size={mode.id === 'list' ? 25 : 24}
							aria-hidden='true'
						/>
					</button>
				)
			})}
		</div>
	)
}
