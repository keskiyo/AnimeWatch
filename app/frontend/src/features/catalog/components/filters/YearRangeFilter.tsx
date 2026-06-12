import { NumberInput } from '@/components/ui/NumberInput'

type YearRangeFilterProps = {
	fromYear: number
	toYear: number
	onFromYearChange: (year: number) => void
	onToYearChange: (year: number) => void
}

export function YearRangeFilter({
	fromYear,
	toYear,
	onFromYearChange,
	onToYearChange,
}: YearRangeFilterProps) {
	return (
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
	)
}
