import type { StudioSortBarProps, StudioSortKey } from '@/types/studio'

const SORT_LABELS: Record<StudioSortKey, string> = {
	year: 'году',
	rating: 'рейтингу',
	title: 'названию',
}

export function StudioSortBar({ sort, direction, onChange }: StudioSortBarProps) {
	return (
		<div className='mb-5 flex flex-wrap items-center gap-2 text-sm text-aw-subtle'>
			<span>Сортировать по:</span>
			{(Object.keys(SORT_LABELS) as StudioSortKey[]).map(key => (
				<button
					key={key}
					type='button'
					onClick={() => onChange(key)}
					className={`cursor-pointer rounded px-2 py-0.5 transition-colors ${
						sort === key
							? 'text-aw-accent underline underline-offset-2'
							: 'hover:text-aw-text'
					}`}
				>
					{SORT_LABELS[key]}
					{sort === key && (
						<span className='ml-0.5 text-xs'>
							{direction === 'desc' ? '↓' : '↑'}
						</span>
					)}
				</button>
			))}
		</div>
	)
}
