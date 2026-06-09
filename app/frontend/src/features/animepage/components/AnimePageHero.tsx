import { AnimeInfoPanel } from '@/features/animepage/components/AnimeInfoPanel'
import { AnimePosterActions } from '@/features/animepage/components/AnimePosterActions'
import type { AnimePageData } from '@/types/animePage'
import { Star } from 'lucide-react'

type AnimePageHeroProps = {
	data: AnimePageData
}

export function AnimePageHero({ data }: AnimePageHeroProps) {
	const rating = data.anime.rating
	const ratingLabel = rating > 0 ? rating.toFixed(2) : null

	return (
		<section className='rounded-lg bg-aw-surface px-4 py-5'>
			<div className='mb-3 flex items-start gap-8 max-[760px]:gap-4'>
				<div className='flex items-center gap-4 text-xs text-aw-text'>
					<Star
						size={32}
						fill='#f5d124'
						className='text-[#f5d124]'
						aria-hidden='true'
					/>
					{ratingLabel ? (
						<span className='font-semibold leading-none text-aw-text text-[25px]'>
							{ratingLabel}
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
				<AnimePosterActions anime={data.anime} />
				<AnimeInfoPanel rows={data.infoRows} />
			</div>
			<div className='mt-8 grid gap-5 text-base leading-relaxed text-aw-text'>
				{data.description.map(paragraph => (
					<p key={paragraph} className='m-0'>
						{paragraph}
					</p>
				))}
			</div>
		</section>
	)
}
