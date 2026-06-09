import { AnimeFrames } from '@/features/animepage/components/AnimeFrames'
import { AnimePageHero } from '@/features/animepage/components/AnimePageHero'
import { AnimePlayer } from '@/features/animepage/components/AnimePlayer'
import { AnimeRelated } from '@/features/animepage/components/AnimeRelated'
import { EpisodeSchedule } from '@/features/animepage/components/EpisodeSchedule'
import type { AnimePageData } from '@/types/animePage'

type AnimePageContentProps = {
	data: AnimePageData
}

export function AnimePageContent({ data }: AnimePageContentProps) {
	return (
		<div className='mx-auto grid max-w-345 gap-5 px-4 py-5 pb-10'>
			<AnimePageHero data={data} />
			<AnimeFrames frames={data.frames} />
			<AnimeRelated items={data.relatedAnime} />
			<AnimePlayer
				title={data.playerTitle}
				background={data.playerGradient}
				tracks={data.playerTracks}
				episodes={data.playerEpisodes}
				player={data.player}
				activeEpisodeTitle={data.activeEpisodeTitle}
				activeEpisodeDate={data.activeEpisodeDate}
			/>
			<EpisodeSchedule rows={data.scheduleRows} />
		</div>
	)
}
