import type { AnimeScheduleRow } from '@/types/animePage'
import { Check, Eye } from 'lucide-react'

type EpisodeScheduleProps = {
	rows: AnimeScheduleRow[]
}

export function EpisodeSchedule({ rows }: EpisodeScheduleProps) {
	return (
		<section className='rounded-lg bg-aw-surface px-5 py-4'>
			<h2 className='mb-1 text-2xl font-normal leading-tight text-aw-text'>
				График выхода серий
			</h2>
			<p className='mb-4 text-xs text-aw-text'>
				Внимание! В графике указаны даты выхода эпизодов на телеэкранах
				Японии. На сайте появится в течение дня либо на следующий день.
			</p>
			<div className='overflow-x-auto'>
				<table className='w-full min-w-180 border-collapse text-sm text-aw-text'>
					<thead>
						<tr className='bg-aw-bg text-left'>
							<th className='rounded-l-md px-3.5 py-2 font-semibold'>
								Номер серии
							</th>
							<th className='px-3.5 py-2 font-semibold'>
								Название
							</th>
							<th className='w-8 px-3.5 py-2' aria-label='Просмотр' />
							<th className='px-3.5 py-2 font-semibold'>
								Дата выхода
							</th>
							<th className='rounded-r-md px-3.5 py-2 font-semibold'>
								Статус
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map(row => (
							<tr key={row.episode}>
								<td className='px-3.5 py-4'>{row.episode}</td>
								<td className='px-3.5 py-4 font-semibold'>
									{row.title}
								</td>
								<td className='px-3.5 py-4 text-aw-subtle'>
									<Eye size={14} aria-hidden='true' />
								</td>
								<td className='px-3.5 py-4'>{row.releaseDate}</td>
								<td className='px-3.5 py-4'>
									{row.status === 'released' ? (
										<Check
											size={15}
											className='text-[#2fb36c]'
											aria-label='Вышла'
										/>
									) : (
										<span>через 9 часов</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className='mt-2 flex justify-center'>
				<button
					type='button'
					className='border-b border-dashed border-aw-text bg-transparent text-sm text-aw-text hover:text-aw-accent'
				>
					Показать ещё
				</button>
			</div>
		</section>
	)
}
