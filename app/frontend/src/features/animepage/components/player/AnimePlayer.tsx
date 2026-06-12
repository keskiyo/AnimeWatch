import { AnimePlayerEpisodes } from '@/features/animepage/components/player/AnimePlayerEpisodes'
import { AnimePlayerFrame } from '@/features/animepage/components/player/AnimePlayerFrame'
import { AnimePlayerMobileControls } from '@/features/animepage/components/player/AnimePlayerMobileControls'
import { AnimePlayerOptionsDrawer } from '@/features/animepage/components/player/AnimePlayerOptionsDrawer'
import { AnimePlayerSidebar } from '@/features/animepage/components/player/AnimePlayerSidebar'
import { AnimePlayerStreamFrame } from '@/features/animepage/components/player/AnimePlayerStreamFrame'
import { useAnimegoPlayer } from '@/features/animepage/hooks/useAnimegoPlayer'
import { useAnimePlayerState } from '@/features/animepage/hooks/useAnimePlayerState'
import { useFormattedDate } from '@/features/catalog/hooks/useFormattedDate'
import type { AnimePlayerProps } from '@/types/animePage'
import { formatPlayerAgeRating } from '@/utils/animePageLabels'
import { useEffect, useMemo, useState } from 'react'

export function AnimePlayer({
	animeId,
	title,
	background,
	tracks,
	episodes,
	player,
	activeEpisodeTitle,
	activeEpisodeDate,
	ageRating,
	providers = [],
	activeTrackId,
	activeProviderId,
	onTrackChange,
	onProviderChange,
}: AnimePlayerProps) {
	const formattedDate = useFormattedDate({ activeEpisodeDate })
	const displayRating = formatPlayerAgeRating(ageRating)
	const [isOptionsOpen, setIsOptionsOpen] = useState(false)
	// Episode count from the backup provider feeds the episode selector even
	// when Kodik is down (set from the animego hook below, one render later)
	const [animegoEpisodes, setAnimegoEpisodes] = useState(0)

	const {
		availableEpisodesCount,
		activeEpisode,
		setActiveEpisode,
		visibleTracks,
		effectiveProviders,
		playerSrc,
		currentEpisodeTitle,
	} = useAnimePlayerState({
		player,
		tracks,
		providers,
		activeTrackId,
		activeEpisodeTitle,
		onTrackChange,
		extraEpisodesCount: animegoEpisodes,
	})

	const activeProvider = effectiveProviders.find(
		provider => provider.id === activeProviderId,
	)
	const isAnimego = activeProvider?.id === 'animego'

	const animego = useAnimegoPlayer(animeId, activeEpisode ?? 1, isAnimego)
	useEffect(() => {
		if (animego.episodesCount > 0) setAnimegoEpisodes(animego.episodesCount)
	}, [animego.episodesCount])

	// The sidebar shows the tracks of whichever provider is active
	const shownTracks = isAnimego ? animego.tracks : visibleTracks
	const shownTrackId = isAnimego ? animego.activeVoiceId : activeTrackId
	const onShownTrackChange = isAnimego ? animego.selectVoice : onTrackChange
	const activeTrack = shownTracks.find(track => track.id === shownTrackId)
	const normalizedActiveEpisode = activeEpisode ?? episodes[0]?.number ?? 1

	const sidebarProps = useMemo(
		() => ({
			tracks: shownTracks,
			providers: effectiveProviders,
			hasEpisodes: availableEpisodesCount > 0,
			activeTrackId: shownTrackId,
			activeProviderId,
			onTrackChange: onShownTrackChange,
			onProviderChange,
		}),
		[
			activeProviderId,
			shownTrackId,
			availableEpisodesCount,
			effectiveProviders,
			onProviderChange,
			onShownTrackChange,
			shownTracks,
		],
	)

	return (
		<section id='watch-player' className='scroll-mt-20'>
			<div className='mb-3 flex items-start justify-between gap-3'>
				<h2 className='m-0 text-2xl font-normal leading-tight text-aw-text max-[760px]:text-[22px]'>
					{title}
				</h2>
				{displayRating && (
					<span className='shrink-0 text-2xl font-bold text-aw-subtle max-[760px]:text-xl'>
						{displayRating}
					</span>
				)}
			</div>

			<div className='grid grid-cols-[minmax(0,1fr)_260px] gap-4 max-[900px]:grid-cols-1'>
				<div>
					{isAnimego ? (
						<AnimePlayerStreamFrame
							stream={animego.stream}
							isLoading={animego.isLoading}
							title={title}
						/>
					) : (
						<AnimePlayerFrame
							title={title}
							background={background}
							player={player}
							linkOverride={playerSrc}
							availableEpisodesCount={availableEpisodesCount}
							nextEpisodeDate={formattedDate}
						/>
					)}
					<div className='max-[760px]:hidden'>
						<AnimePlayerEpisodes
							episodes={episodes}
							activeEpisode={activeEpisode}
							availableEpisodesCount={availableEpisodesCount}
							onEpisodeChange={setActiveEpisode}
						/>
					</div>
					<div className='min-[761px]:hidden'>
						<AnimePlayerMobileControls
							episodes={episodes}
							activeEpisode={normalizedActiveEpisode}
							availableEpisodesCount={availableEpisodesCount}
							activeTrackLabel={activeTrack?.label}
							activeProviderLabel={activeProvider?.label}
							onEpisodeChange={setActiveEpisode}
							onOpenOptions={() => setIsOptionsOpen(true)}
						/>
					</div>
					<div className='mt-4 grid gap-3 text-sm text-aw-text'>
						{availableEpisodesCount > 0 && !isAnimego && (
							<p className='m-0 text-aw-subtle'>
								Название: {currentEpisodeTitle}
							</p>
						)}
						{formattedDate && (
							<p className='m-0'>
								<span className='text-aw-subtle'>
									Следующий эпизод:
								</span>{' '}
								{formattedDate}
							</p>
						)}
					</div>
				</div>

				<div className='max-[760px]:hidden'>
					<AnimePlayerSidebar {...sidebarProps} />
				</div>
				<AnimePlayerOptionsDrawer
					isOpen={isOptionsOpen}
					onClose={() => setIsOptionsOpen(false)}
					{...sidebarProps}
				/>
			</div>
		</section>
	)
}
