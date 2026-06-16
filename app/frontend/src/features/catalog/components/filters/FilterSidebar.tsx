import { useCatalogFilterParams } from '@/features/catalog/hooks/useCatalogFilterParams'
import { filterGroups } from '@/utils/catalog/catalogData'
import { CheckboxGroup } from './CheckboxGroup'
import { GenreDropdown } from './GenreDropdown'
import { YearRangeFilter } from './YearRangeFilter'

export function FilterSidebar() {
	const filters = useCatalogFilterParams()

	return (
		<aside className='w-75 pt-1 text-aw-text max-[1200px]:w-full'>
			<div className='mb-5 flex items-center justify-between'>
				<h2 className='m-0 text-lg font-semibold'>Фильтр</h2>
				<button
					type='button'
					className='cursor-pointer border-0 bg-transparent p-0 text-sm text-aw-accent transition-colors hover:text-[#ff8f86]'
					onClick={filters.onClickResetFilters}
				>
					Сбросить
				</button>
			</div>
			<YearRangeFilter
				fromYear={filters.fromYear}
				toYear={filters.toYear}
				onFromYearChange={filters.onFromYearChange}
				onToYearChange={filters.onToYearChange}
			/>
			<GenreDropdown
				checked={filters.checkedGenres}
				isStrictMatch={filters.isStrictMatch}
				resetKey={filters.resetKey}
				onToggleGenre={filters.onToggleGenre}
				onToggleStrictMatch={filters.onToggleStrictMatch}
			/>
			{filterGroups.map(group => (
				<CheckboxGroup
					key={group.title}
					group={group}
					checked={filters.checked}
					onToggle={filters.onToggle}
				/>
			))}
		</aside>
	)
}
