import { getPlayerProviders } from '@/api/playerApi'
import { AnimeRelated } from '@/features/animepage/components/AnimeRelated'
import { ReviewsAnimePage } from '@/features/animepage/components/comments/ReviewsAnimePage'
import { AnimeFrames } from '@/features/animepage/components/frames/AnimeFrames'
import { AnimePageHero } from '@/features/animepage/components/hero/AnimePageHero'
import { AnimePlayer } from '@/features/animepage/components/player/AnimePlayer'
import type { AnimePageData, PlayerProvider } from '@/types/animePage'
import { useEffect, useState } from 'react'

type AnimePageContentProps = {
	data: AnimePageData
}

export function AnimePageContent({ data }: AnimePageContentProps) {
	const [activeTrackId, setActiveTrackId] = useState<string | undefined>(
		data.playerTracks.find(t => t.isActive)?.id ?? data.playerTracks[0]?.id,
	)
	const [providers, setProviders] = useState<PlayerProvider[]>(
		data.playerProviders ?? [],
	)
	const [activeProviderId, setActiveProviderId] = useState<
		string | undefined
	>(data.playerProviders?.[0]?.id)

	// Real provider availability (kodik + animego backup) from the backend.
	// Auto-fallback: when Kodik is down, pick the first available provider.
	useEffect(() => {
		let cancelled = false
		getPlayerProviders(data.anime.id).then(loaded => {
			if (cancelled || loaded.length === 0) return
			setProviders(loaded)
			setActiveProviderId(prev => {
				const current = loaded.find(p => p.id === prev)
				if (current?.available) return prev
				const kodik = loaded.find(p => p.id === 'kodik')
				if (kodik?.available) return 'kodik'
				return loaded.find(p => p.available)?.id ?? prev
			})
		})
		return () => {
			cancelled = true
		}
	}, [data.anime.id])

	return (
		<div className='mx-auto grid max-w-345 gap-5 px-4 py-5 pb-10'>
			<AnimePageHero data={data} />
			<AnimeFrames frames={data.frames} />
			<AnimeRelated items={data.relatedAnime} />
			<AnimePlayer
				animeId={data.anime.id}
				title={data.playerTitle}
				background={data.playerGradient}
				tracks={data.playerTracks}
				episodes={data.playerEpisodes}
				player={data.player}
				activeEpisodeTitle={data.activeEpisodeTitle}
				activeEpisodeDate={data.activeEpisodeDate}
				ageRating={data.ageRating}
				providers={providers}
				activeTrackId={activeTrackId}
				activeProviderId={activeProviderId}
				onTrackChange={setActiveTrackId}
				onProviderChange={setActiveProviderId}
			/>
			<ReviewsAnimePage animeId={data.anime.id} />
		</div>
	)
}
