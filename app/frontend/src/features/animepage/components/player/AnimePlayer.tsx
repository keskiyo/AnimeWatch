import { AnimePlayerEpisodes } from '@/features/animepage/components/player/AnimePlayerEpisodes'
import { AnimePlayerFrame } from '@/features/animepage/components/player/AnimePlayerFrame'
import { AnimePlayerSidebar } from '@/features/animepage/components/player/AnimePlayerSidebar'
import { useAnimePlayerState } from '@/features/animepage/hooks/useAnimePlayerState'
import { useFormattedDate } from '@/features/catalog/hooks/useFormattedDate'
import type { AnimePlayerProps } from '@/types/animePage'
import { formatPlayerAgeRating } from '@/utils/animePageFormatters'

export function AnimePlayer({
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
	})

	return (
		// id + scroll-mt: the «Смотреть онлайн» button scrolls here (header is sticky)
		<section id='watch-player' className='scroll-mt-20'>
			<div className='mb-3 flex items-center justify-between gap-4'>
				<h2 className='m-0 text-2xl font-normal leading-tight text-aw-text'>
					{title}
				</h2>
				{displayRating && (
					<span className='text-2xl font-bold text-aw-subtle'>
						{displayRating}
					</span>
				)}
			</div>

			<div className='grid grid-cols-[minmax(0,1fr)_260px] gap-4 max-[900px]:grid-cols-1'>
				{/* Left: player + episodes + meta */}
				<div>
					<AnimePlayerFrame
						title={title}
						background={background}
						player={player}
						linkOverride={playerSrc}
						availableEpisodesCount={availableEpisodesCount}
						nextEpisodeDate={formattedDate}
					/>
					<AnimePlayerEpisodes
						episodes={episodes}
						activeEpisode={activeEpisode}
						availableEpisodesCount={availableEpisodesCount}
						onEpisodeChange={setActiveEpisode}
					/>
					<div className='mt-4 grid gap-3 text-sm text-aw-text'>
						{availableEpisodesCount > 0 && (
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

				{/* Right: "Озвучка" / "Плеер" tabs */}
				<AnimePlayerSidebar
					tracks={visibleTracks}
					providers={effectiveProviders}
					hasEpisodes={availableEpisodesCount > 0}
					activeTrackId={activeTrackId}
					activeProviderId={activeProviderId}
					onTrackChange={onTrackChange}
					onProviderChange={onProviderChange}
				/>
			</div>
		</section>
	)
}
