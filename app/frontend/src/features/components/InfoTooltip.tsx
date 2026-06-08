import { FilterText } from '@/types/catalog'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

const filterInfoText: Record<FilterText, ReactNode> = {
	'Возрастное ограничение': (
		<div className='space-y-1'>
			<p>
				<b>G</b> - нет возрастных ограничений
			</p>
			<p>
				<b>PG</b> - рекомендуется присутствие родителей
			</p>
			<p>
				<b>PG-13</b> - детям до 13 лет просмотр нежелателен
			</p>
			<p>
				<b>R-17</b> - лицам до 17 лет обязательно присутствие взрослого
			</p>
			<p>
				<b>R+</b> - лицам до 17 лет просмотр запрещён
			</p>
		</div>
	),

	'Количество серий': (
		<div className='space-y-1'>
			<p>
				<b>Короткие</b> - до 13 серий
			</p>
			<p>
				<b>Средние</b> - 14-26 серий
			</p>
			<p>
				<b>Длинные</b> - 27-100 серий
			</p>
			<p>
				<b>Очень длинные</b> - больше 100 серий
			</p>
		</div>
	),
}

type InfoTooltipProps = {
	children?: ReactNode
	name?: FilterText
}

export function InfoTooltip({ children, name }: InfoTooltipProps) {
	const content = name ? filterInfoText[name] : children

	return (
		<span className='relative inline-flex shrink-0 items-center group/info'>
			<Info size={13} className='cursor-help' aria-hidden='true' />

			<span className='pointer-events-none absolute left-1/2 bottom-full z-50 mb-2 w-61.25 -translate-x-1/2 rounded-md bg-neutral-200 px-3 py-2 text-center text-sm font-normal leading-5 text-black opacity-0 shadow-md transition-opacity group-hover/info:opacity-100'>
				{content}

				<span className='absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-neutral-200' />
			</span>
		</span>
	)
}
