import { AnimeFrames } from '@/features/animepage/components/AnimeFrames'
import { AnimePageHero } from '@/features/animepage/components/AnimePageHero'
import { AnimePlayer } from '@/features/animepage/components/AnimePlayer'
import { EpisodeSchedule } from '@/features/animepage/components/EpisodeSchedule'
import type { AnimePageData } from '@/types/animePage'
import { useState } from 'react'

type AnimePageContentProps = {
	data: AnimePageData
}

export function AnimePageContent({ data }: AnimePageContentProps) {
	const [activeTrackId, setActiveTrackId] = useState<string | undefined>(
		data.playerTracks.find(t => t.isActive)?.id ?? data.playerTracks[0]?.id,
	)
	const [activeProviderId, setActiveProviderId] = useState<
		string | undefined
	>(data.playerProviders?.[0]?.id)

	return (
		<div className='mx-auto grid max-w-345 gap-5 px-4 py-5 pb-10'>
			<AnimePageHero data={data} />
			<AnimeFrames frames={data.frames} />
			<AnimePlayer
				title={data.playerTitle}
				background={data.playerGradient}
				tracks={data.playerTracks}
				episodes={data.playerEpisodes}
				player={data.player}
				activeEpisodeTitle={data.activeEpisodeTitle}
				activeEpisodeDate={data.activeEpisodeDate}
				ageRating={data.ageRating}
				providers={data.playerProviders}
				activeTrackId={activeTrackId}
				activeProviderId={activeProviderId}
				onTrackChange={setActiveTrackId}
				onProviderChange={setActiveProviderId}
			/>
			<EpisodeSchedule rows={data.scheduleRows} />
		</div>
	)
}
