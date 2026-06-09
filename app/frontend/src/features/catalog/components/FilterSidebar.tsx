import { NumberInput } from '@/components/ui/NumberInput'
import { filterGroups } from '@/utils/catalogData'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckboxGroup } from './CheckboxGroup'
import { GenreDropdown } from './GenreDropdown'

const CURRENT_YEAR = new Date().getFullYear()

export function FilterSidebar() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [resetKey, setResetKey] = useState(0)

	const checked = new Set(
		searchParams.get('f')?.split(',').filter(Boolean) ?? [],
	)
	const checkedGenres = new Set(
		searchParams.get('genres')?.split(',').filter(Boolean) ?? [],
	)
	const isStrictMatch = searchParams.get('strict') === '1'
	const fromYear = Number(searchParams.get('fromYear') ?? '1980')
	const toYear = Number(searchParams.get('toYear') ?? CURRENT_YEAR)

	function onToggle(value: string) {
		setSearchParams(
			prev => {
				const next = new URLSearchParams(prev)
				const current = new Set(
					next.get('f')?.split(',').filter(Boolean) ?? [],
				)
				if (current.has(value)) current.delete(value)
				else current.add(value)
				if (current.size > 0) next.set('f', [...current].join(','))
				else next.delete('f')
				return next
			},
			{ replace: true },
		)
	}

	function onToggleGenre(value: string) {
		setSearchParams(
			prev => {
				const next = new URLSearchParams(prev)
				const current = new Set(
					next.get('genres')?.split(',').filter(Boolean) ?? [],
				)
				if (current.has(value)) current.delete(value)
				else current.add(value)
				if (current.size > 0) next.set('genres', [...current].join(','))
				else next.delete('genres')
				return next
			},
			{ replace: true },
		)
	}

	function onToggleStrictMatch() {
		setSearchParams(
			prev => {
				const next = new URLSearchParams(prev)
				if (next.get('strict') === '1') next.delete('strict')
				else next.set('strict', '1')
				return next
			},
			{ replace: true },
		)
	}

	function onFromYearChange(year: number) {
		setSearchParams(
			prev => {
				const next = new URLSearchParams(prev)
				next.set('fromYear', String(year))
				return next
			},
			{ replace: true },
		)
	}

	function onToYearChange(year: number) {
		setSearchParams(
			prev => {
				const next = new URLSearchParams(prev)
				next.set('toYear', String(year))
				return next
			},
			{ replace: true },
		)
	}

	function onClickResetFilters() {
		setSearchParams(
			prev => {
				const next = new URLSearchParams(prev)
				next.delete('f')
				next.delete('genres')
				next.delete('strict')
				next.delete('fromYear')
				next.delete('toYear')
				return next
			},
			{ replace: true },
		)
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
					value={fromYear}
					min={1959}
					max={toYear}
					aria-label='Год от'
					onChange={event => onFromYearChange(Number(event.target.value))}
				/>
				<NumberInput
					className='h-9 w-27.5 rounded-full border-0 bg-[#343638] px-3 text-[#c5cbd1]'
					wrapperClassName='w-[110px]'
					value={toYear}
					min={fromYear}
					aria-label='Год до'
					onChange={event => onToYearChange(Number(event.target.value))}
				/>
			</div>
			<GenreDropdown
				checked={checkedGenres}
				isStrictMatch={isStrictMatch}
				resetKey={resetKey}
				onToggleGenre={onToggleGenre}
				onToggleStrictMatch={onToggleStrictMatch}
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
