import type { GenreDropdownProps } from '@/types/catalog'
import { filterGenreOptions } from '@/utils/catalogData'
import { STRICT_MATCH_TOOLTIP } from '@/utils/catalogTexts'
import { ChevronDown, Info } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export function GenreDropdown({
	checked,
	isStrictMatch,
	resetKey,
	onToggleGenre,
	onToggleStrictMatch,
}: GenreDropdownProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [search, setSearch] = useState('')
	const genres = useMemo(() => filterGenreOptions(search), [search])

	useEffect(() => {
		setSearch('')
	}, [resetKey])

	return (
		<section className='mb-7'>
			<button
				type='button'
				className='inline-flex cursor-pointer items-center gap-0.5 border-0 bg-transparent p-0 text-aw-text'
				aria-expanded={isOpen}
				onClick={() => setIsOpen(value => !value)}
			>
				Жанры
				<ChevronDown size={14} aria-hidden='true' />
			</button>
			{isOpen && (
				<div className='mt-3.5'>
					<input
						className='h-8 w-full rounded-full border-0 bg-[#343638] px-3.5 text-sm text-aw-text placeholder:text-aw-subtle'
						type='search'
						value={search}
						placeholder='Фильтр по жанрам'
						aria-label='Фильтр по жанрам'
						onChange={event => setSearch(event.target.value)}
					/>
					<div className='relative my-3 flex items-center gap-2'>
						<label className='flex cursor-pointer items-center gap-2 text-[15px] text-aw-text'>
							<input
								className="relative m-0 inline-flex h-3.5 w-8 appearance-none rounded-full border border-[#3f4244] bg-[#2b2d2e] before:absolute before:left-0.75 before:top-0.5 before:h-2 before:w-2 before:rounded-full before:bg-[#6f7478] before:transition-transform before:content-[''] checked:border-aw-accent checked:bg-aw-accent checked:before:translate-x-4 checked:before:bg-white"
								type='checkbox'
								checked={isStrictMatch}
								onChange={onToggleStrictMatch}
							/>
							<span>Строгое совпадение</span>
						</label>
						<button
							type='button'
							className='peer inline-flex cursor-help items-center border-0 bg-transparent p-0 text-[#dce1e6]'
							aria-label={STRICT_MATCH_TOOLTIP}
							aria-describedby='strict-match-tooltip'
						>
							<Info size={13} aria-hidden='true' />
						</button>
						<span
							id='strict-match-tooltip'
							role='tooltip'
							className='absolute bottom-6 left-0 z-10 hidden w-51.25 rounded-[5px] bg-[#f1f1f1] px-2.5 py-2 text-[13px] leading-[1.45] text-[#171819] peer-hover:block peer-focus-visible:block'
						>
							<b>«Строгое совпадение» включено</b> - в результатах
							будут отображаться только те тайтлы, которые
							одновременно относятся ко всем выбранным жанрам.{' '}
							<b>«Строгое совпадение» отключено</b> - в
							результатах будут показаны тайтлы, которые содержат
							хотя бы один из выбранных жанров.
						</span>
					</div>
					<div className='grid max-h-155 gap-2 overflow-y-auto pr-1 [scrollbar-color:#9b9da0_transparent] scrollbar-thin'>
						{genres.map(genre => (
							<label
								key={genre}
								className='inline-flex min-h-4.5 cursor-pointer items-center gap-2 text-[15px] text-aw-text'
							>
								<input
									className="grid h-3.75 w-3.75 shrink-0 appearance-none place-content-center rounded border border-[#3c3f40] bg-transparent before:h-2.25 before:w-2.25 before:scale-0 before:rounded-xs before:bg-aw-accent before:transition-transform before:content-[''] checked:border-aw-accent checked:before:scale-100"
									type='checkbox'
									checked={checked.has(genre)}
									onChange={() => onToggleGenre(genre)}
								/>
								<span>{genre}</span>
							</label>
						))}
					</div>
				</div>
			)}
		</section>
	)
}
