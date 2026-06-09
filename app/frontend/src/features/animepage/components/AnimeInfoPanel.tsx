import type { AnimeInfoLink, AnimeInfoRow } from '@/types/animePage'
import { CircleHelp } from 'lucide-react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'

type AnimeInfoPanelProps = {
	rows: AnimeInfoRow[]
}

const LINK_CLASS =
	'text-aw-accent no-underline transition-colors hover:text-[#ff8f86] hover:underline'

function InfoLink({ link }: { link: AnimeInfoLink }) {
	const isExternal = /^https?:\/\//.test(link.href)
	if (isExternal) {
		return (
			<a
				href={link.href}
				className={LINK_CLASS}
				target='_blank'
				rel='noopener noreferrer'
			>
				{link.label}
			</a>
		)
	}
	return (
		<Link to={link.href} className={LINK_CLASS}>
			{link.label}
		</Link>
	)
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
						{row.links ? (
							row.links.map((link, index) => (
								<Fragment key={`${link.href}-${index}`}>
									{index > 0 && ', '}
									<InfoLink link={link} />
								</Fragment>
							))
						) : row.tone === 'badge' ? (
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
