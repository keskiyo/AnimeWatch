import type { SortDropdownProps, SortOption } from '@/types/catalog'
import { sortOptions } from '@/utils/catalogData'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function SortDropdown({
	selected,
	sortDirection,
	onChange,
}: SortDropdownProps) {
	const [isOpen, setIsOpen] = useState(false)
	const rootRef = useRef<HTMLDivElement>(null)
	const DirectionIcon = sortDirection === 'desc' ? ChevronDown : ChevronUp

	useEffect(() => {
		function onClickDocument(event: MouseEvent) {
			if (!rootRef.current?.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', onClickDocument)
		}

		return () => document.removeEventListener('mousedown', onClickDocument)
	}, [isOpen])

	function onSelect(option: SortOption) {
		onChange(option)
		setIsOpen(false)
	}

	return (
		<div
			ref={rootRef}
			className='relative inline-flex items-center gap-2.5 text-aw-text'
		>
			<span>Сортировать по:</span>
			<button
				type='button'
				className='inline-flex cursor-pointer items-center gap-0.5 border-0 bg-transparent p-0 text-aw-accent'
				onClick={() => setIsOpen(value => !value)}
				aria-expanded={isOpen}
				aria-haspopup='listbox'
			>
				{selected}
				<DirectionIcon size={13} aria-hidden='true' />
			</button>
			{isOpen && (
				<div
					className="absolute left-30 top-7.5 z-10 w-44.5 rounded-md bg-aw-muted py-2.5 shadow-[0_12px_24px_rgba(0,0,0,0.3)] before:absolute before:left-7.5 before:-top-2.5 before:border-x-10 before:border-b-10 before:border-x-transparent before:border-b-aw-muted before:content-['']"
					role='listbox'
				>
					{sortOptions.map(option => (
						<button
							key={option}
							type='button'
							className={`grid min-h-8 w-full cursor-pointer grid-cols-[18px_1fr] items-center gap-2 border-0 px-3.5 text-left text-[15px] text-aw-text hover:bg-aw-elevated ${
								option === selected
									? 'bg-aw-elevated'
									: 'bg-transparent'
							}`}
							onClick={() => onSelect(option)}
							role='option'
							aria-selected={option === selected}
						>
							<span className='inline-flex items-center justify-center text-aw-text'>
								{option === selected && (
									<Check size={14} aria-hidden='true' />
								)}
							</span>
							{option}
						</button>
					))}
				</div>
			)}
		</div>
	)
}

// ! сортировка меняется при повторном нажатии на кнопку

// ! сортировки anime/filter?sort=createdAt&direction=desc&page=1 и anime/filter?sort=createdAt&direction=asc&page=1 это по дате добавления

// ! anime/filter?sort=startDate&direction=asc&page=1 и filter?sort=startDate&direction=desc&page=1 это по новизне

// ! filter?sort=rating&direction=desc&page=1 и filter?sort=rating&direction=asc&page=1 это по рейтингу

// и сортировка не должна быть только по первым 12 загруженным, а по всем что есть на shikimori и убери  [character=186854]Химмеля[/character] оставляй только Химмеля и [character=184947]Фрирен[/character] тут Фрирен
// так же под кадрами добавь блок связанное и там будут аниме которые связаны продолжения или же альтернативные истории

// так же сделай блоки с оценками разными цветами с 10-7 зеленым, с 6.9-4 желтым а если ниже 3.9-0 то красным и сам блок фильтров сделай чтобы при выборе чекбокса сортировка начиналась сразу же

// сделай метаданные для страниц
