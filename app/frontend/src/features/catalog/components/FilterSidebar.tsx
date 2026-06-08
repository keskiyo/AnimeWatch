import { NumberInput } from '@/components/ui/NumberInput'
import {
	createEmptyCatalogFilterState,
	filterGroups,
} from '@/utils/catalogData'
import { useState } from 'react'
import { CheckboxGroup } from './CheckboxGroup'
import { GenreDropdown } from './GenreDropdown'

export function FilterSidebar() {
	const [checked, setChecked] = useState(
		() => createEmptyCatalogFilterState().checked,
	)
	const [checkedGenres, setCheckedGenres] = useState(
		() => createEmptyCatalogFilterState().checkedGenres,
	)
	const [isStrictMatch, setIsStrictMatch] = useState(
		() => createEmptyCatalogFilterState().isStrictMatch,
	)
	const [fromYear, setFromYear] = useState(1959)
	const [toYear, setToYear] = useState(2026)
	const [resetKey, setResetKey] = useState(0)

	function onToggle(value: string) {
		setChecked(current => {
			const next = new Set(current)
			if (next.has(value)) {
				next.delete(value)
			} else {
				next.add(value)
			}
			return next
		})
	}

	function onToggleGenre(value: string) {
		setCheckedGenres(current => {
			const next = new Set(current)
			if (next.has(value)) {
				next.delete(value)
			} else {
				next.add(value)
			}
			return next
		})
	}

	function onClickResetFilters() {
		const emptyState = createEmptyCatalogFilterState()
		setChecked(emptyState.checked)
		setCheckedGenres(emptyState.checkedGenres)
		setIsStrictMatch(emptyState.isStrictMatch)
		setFromYear(1959)
		setToYear(2026)
		setResetKey(value => value + 1)
	}

	return (
		<aside className='w-75 pt-1 text-aw-text max-[1200px]:w-full'>
			<div className='mb-5 flex items-center justify-between'>
				<h2 className='m-0 text-lg font-semibold'>Фильтр</h2>
				<button
					type='button'
					className='cursor-pointer border-0 bg-transparent p-0 text-sm text-aw-accent transition-colors hover:text-[#ff8f86]'
					onClick={onClickResetFilters}
				>
					Сбросить
				</button>
			</div>
			<div className='mb-8.5 flex gap-6'>
				<NumberInput
					className='h-9 w-27.5 rounded-full border-0 bg-[#343638] px-3 text-[#c5cbd1]'
					wrapperClassName='w-[110px]'
					value={fromYear}
					min={1959}
					max={toYear}
					aria-label='Год от'
					onChange={event => setFromYear(Number(event.target.value))}
				/>
				<NumberInput
					className='h-9 w-27.5 rounded-full border-0 bg-[#343638] px-3 text-[#c5cbd1]'
					wrapperClassName='w-[110px]'
					value={toYear}
					min={fromYear}
					aria-label='Год до'
					onChange={event => setToYear(Number(event.target.value))}
				/>
			</div>
			<GenreDropdown
				checked={checkedGenres}
				isStrictMatch={isStrictMatch}
				resetKey={resetKey}
				onToggleGenre={onToggleGenre}
				onToggleStrictMatch={() => setIsStrictMatch(value => !value)}
			/>
			{filterGroups.map(group => (
				<CheckboxGroup
					key={group.title}
					group={group}
					checked={checked}
					onToggle={onToggle}
				/>
			))}
		</aside>
	)
}
