import { InfoTooltip } from '@/features/components/InfoTooltip'
import type { CheckboxGroupProps } from '@/types/catalog'

export function CheckboxGroup({
	group,
	checked,
	onToggle,
}: CheckboxGroupProps) {
	return (
		<section className='mt-7 overflow-visible'>
			<h3 className='mb-4 flex items-center gap-1 text-sm font-semibold text-[#dce1e6]'>
				{group.title}

				{group.hasInfo && <InfoTooltip name={group.hasInfo} />}
			</h3>

			<div className='grid grid-cols-2 gap-x-6 gap-y-3.5'>
				{group.options.map(option => (
					<label
						key={option}
						className='inline-flex min-h-4.5 cursor-pointer items-center gap-2 text-[15px] text-aw-text'
					>
						<input
							className="grid h-3.75 w-3.75 appearance-none place-content-center rounded border border-[#3c3f40] bg-transparent before:h-2.25 before:w-2.25 before:scale-0 before:rounded-xs before:bg-aw-accent before:transition-transform before:content-[''] checked:border-aw-accent checked:before:scale-100"
							type='checkbox'
							checked={checked.has(`${group.title}:${option}`)}
							onChange={() =>
								onToggle(`${group.title}:${option}`)
							}
						/>

						<span>{option}</span>

						{option === 'Недавно' && (
							<InfoTooltip>
								Вышедшие за последние 6 месяцев
							</InfoTooltip>
						)}
					</label>
				))}
			</div>
		</section>
	)
}
