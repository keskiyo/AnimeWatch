import type { AnimeInfoRow } from '@/types/animePage'
import { CircleHelp } from 'lucide-react'

type AnimeInfoPanelProps = {
	rows: AnimeInfoRow[]
}

export function AnimeInfoPanel({ rows }: AnimeInfoPanelProps) {
	return (
		<dl className='grid flex-1 grid-cols-[210px_minmax(0,1fr)] gap-x-12 gap-y-3 text-sm max-[760px]:grid-cols-1 max-[760px]:gap-y-1.5'>
			{rows.map(row => (
				<div
					key={`${row.label}-${row.value}`}
					className='contents max-[760px]:block'
				>
					<dt className='flex items-center gap-1.5 text-aw-subtle'>
						{row.label}
						{row.label === 'Следующий эпизод' && (
							<CircleHelp
								size={13}
								className='text-aw-subtle'
								aria-hidden='true'
							/>
						)}
					</dt>
					<dd
						className={`m-0 leading-relaxed ${
							row.tone === 'accent'
								? 'text-aw-accent'
								: 'text-aw-text'
						}`}
					>
						{row.tone === 'badge' ? (
							<span className='rounded bg-white px-1.5 py-1 text-sm font-bold leading-none text-black'>
								{row.value}
							</span>
						) : (
							row.value
						)}
					</dd>
				</div>
			))}
		</dl>
	)
}
