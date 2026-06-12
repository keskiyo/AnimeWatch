import { AnimeInfoPanel } from '@/features/animepage/components/hero/AnimeInfoPanel'
import { AnimePosterActions } from '@/features/animepage/components/hero/AnimePosterActions'
import type { AnimePageData } from '@/types/animePage'
import { Star } from 'lucide-react'
import { useState } from 'react'

type AnimePageHeroProps = {
	data: AnimePageData
}

export function AnimePageHero({ data }: AnimePageHeroProps) {
	const rating = data.anime.rating
	const hasRating = rating > 0
	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

	return (
		<section className='rounded-lg bg-aw-surface px-4 py-5'>
			<div className='mb-3 flex items-start gap-8 max-[760px]:gap-4'>
				<div className='flex items-center gap-3 text-xs text-aw-text'>
					<Star
						size={32}
						fill={hasRating ? '#f5d124' : 'transparent'}
						strokeWidth={hasRating ? 0 : 1.5}
						className={
							hasRating ? 'text-[#f5d124]' : 'text-aw-subtle'
						}
						aria-hidden='true'
					/>
					{hasRating ? (
						<span className='text-lg font-bold leading-tight text-aw-text'>
							{rating.toFixed(2)}
						</span>
					) : (
						<span className='leading-tight text-aw-subtle'>
							Нет
							<br />
							оценок
						</span>
					)}
				</div>
			</div>
			<h1 className='mb-5 max-w-7xl text-[clamp(32px,4vw,40px)] font-normal leading-tight text-aw-text'>
				{data.fullTitle}
			</h1>
			<div className='flex gap-6 max-[760px]:flex-col'>
				<AnimePosterActions anime={data.anime} player={data.player} />
				<AnimeInfoPanel rows={data.infoRows} />
			</div>
			<div
				className={`mt-8 grid gap-4 overflow-hidden text-base leading-relaxed text-aw-text max-[760px]:mt-5 max-[760px]:text-[15px] max-[760px]:leading-[1.55] ${
					isDescriptionExpanded
						? ''
						: 'max-[760px]:max-h-[15.5rem]'
				}`}
			>
				{data.description.map(paragraph => (
					<p key={paragraph} className='m-0'>
						{paragraph}
					</p>
				))}
			</div>
			{!isDescriptionExpanded && (
				<button
					type='button'
					onClick={() => setIsDescriptionExpanded(true)}
					className='mt-2 hidden cursor-pointer border-0 bg-transparent p-0 text-sm text-aw-accent hover:text-aw-accent-hover max-[760px]:inline-flex'
				>
					Развернуть
				</button>
			)}
		</section>
	)
}
