import { PlayerPlaceholder } from '@/features/animepage/components/player/PlayerPlaceholder'
import type { KodikPlayer } from '@/types/anime'
import { isAllowedPlayerUrl } from '@/utils/player'

type AnimePlayerFrameProps = {
	title: string
	background: string
	player?: KodikPlayer
	/** Link of the selected dubbing track — overrides the default player link. */
	linkOverride?: string
	availableEpisodesCount?: number
	nextEpisodeDate?: string | null
}

export function AnimePlayerFrame({
	title,
	background,
	player,
	linkOverride,
	availableEpisodesCount = 0,
	nextEpisodeDate,
}: AnimePlayerFrameProps) {
	const playerLink =
		linkOverride && isAllowedPlayerUrl(linkOverride)
			? linkOverride
			: player?.available
				? player.link
				: ''
	const canRenderPlayer =
		player?.available && isAllowedPlayerUrl(playerLink)

	return (
		<div
			className='relative flex aspect-video min-h-75 items-center justify-center overflow-hidden rounded-sm bg-aw-elevated max-[760px]:min-h-0'
			style={{ background }}
		>
			{canRenderPlayer ? (
				<iframe
					className='h-full w-full border-0'
					src={playerLink}
					title={`${title} Kodik player`}
					allow='autoplay; fullscreen; picture-in-picture'
					allowFullScreen
					referrerPolicy='no-referrer-when-downgrade'
				/>
			) : (
				<PlayerPlaceholder
					player={player}
					availableEpisodesCount={availableEpisodesCount}
					nextEpisodeDate={nextEpisodeDate}
				/>
			)}
		</div>
	)
}
