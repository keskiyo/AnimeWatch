import { NumberInput } from '@/components/ui/NumberInput'
import { useCatalogFilters } from '@/features/catalog/hooks/useCatalogFilters'
import { filterGroups } from '@/utils/catalogData'
import { useEffect, useRef, useState } from 'react'
import { CheckboxGroup } from './CheckboxGroup'
import { GenreDropdown } from './GenreDropdown'

export function FilterSidebar() {
	const {
		params,
		checkedSet,
		checkedGenres,
		toggleCheckbox,
		toggleGenre,
		toggleStrictMatch,
		setYearFrom,
		setYearTo,
		resetFilters,
	} = useCatalogFilters()

	const [localYearFrom, setLocalYearFrom] = useState(params.yearFrom)
	const [localYearTo, setLocalYearTo] = useState(params.yearTo)

	const prevYearFromRef = useRef(params.yearFrom)
	const prevYearToRef = useRef(params.yearTo)
	useEffect(() => {
		if (params.yearFrom !== prevYearFromRef.current) {
			setLocalYearFrom(params.yearFrom)
			prevYearFromRef.current = params.yearFrom
		}
	}, [params.yearFrom])
	useEffect(() => {
		if (params.yearTo !== prevYearToRef.current) {
			setLocalYearTo(params.yearTo)
			prevYearToRef.current = params.yearTo
		}
	}, [params.yearTo])

	useEffect(() => {
		const timer = setTimeout(() => setYearFrom(localYearFrom), 500)
		return () => clearTimeout(timer)
	}, [localYearFrom, setYearFrom])
	useEffect(() => {
		const timer = setTimeout(() => setYearTo(localYearTo), 500)
		return () => clearTimeout(timer)
	}, [localYearTo, setYearTo])

	const [resetKey, setResetKey] = useState(0)

	function onClickResetFilters() {
		resetFilters()
		setLocalYearFrom(1959)
		setLocalYearTo(new Date().getFullYear())
		setResetKey(k => k + 1)
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
					value={localYearFrom}
					min={1959}
					max={localYearTo}
					aria-label='Год от'
					onChange={event =>
						setLocalYearFrom(Number(event.target.value))
					}
				/>
				<NumberInput
					className='h-9 w-27.5 rounded-full border-0 bg-[#343638] px-3 text-[#c5cbd1]'
					wrapperClassName='w-[110px]'
					value={localYearTo}
					min={localYearFrom}
					aria-label='Год до'
					onChange={event =>
						setLocalYearTo(Number(event.target.value))
					}
				/>
			</div>
			<GenreDropdown
				checked={checkedGenres}
				isStrictMatch={params.strictMatch}
				resetKey={resetKey}
				onToggleGenre={toggleGenre}
				onToggleStrictMatch={toggleStrictMatch}
			/>
			{filterGroups.map(group => (
				<CheckboxGroup
					key={group.title}
					group={group}
					checked={checkedSet}
					onToggle={toggleCheckbox}
				/>
			))}
		</aside>
	)
}
