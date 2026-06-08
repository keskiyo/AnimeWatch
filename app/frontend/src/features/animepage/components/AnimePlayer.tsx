import { AnimePlayerEpisodes } from '@/features/animepage/components/AnimePlayerEpisodes'
import { AnimePlayerFrame } from '@/features/animepage/components/AnimePlayerFrame'
import { AnimePlayerTracks } from '@/features/animepage/components/AnimePlayerTracks'
import { useFormattedDate } from '@/features/catalog/hooks/useFormattedDate'
import type { KodikPlayer } from '@/types/anime'
import type { AnimePlayerEpisode, AnimePlayerTrack } from '@/types/animePage'

type AnimePlayerProps = {
	title: string
	background: string
	tracks: AnimePlayerTrack[]
	episodes: AnimePlayerEpisode[]
	player?: KodikPlayer
	activeEpisodeTitle: string
	activeEpisodeDate: string
}

export function AnimePlayer({
	title,
	background,
	tracks,
	episodes,
	player,
	activeEpisodeTitle,
	activeEpisodeDate,
}: AnimePlayerProps) {
	const formattedDate = useFormattedDate({ activeEpisodeDate })

	return (
		<section>
			<div className='mb-3 flex items-center justify-between gap-4'>
				<h2 className='m-0 text-2xl font-normal leading-tight text-aw-text'>
					{title}
				</h2>
				<span className='text-2xl font-bold text-aw-subtle'>16+</span>
			</div>
			<div className='grid grid-cols-[minmax(0,1fr)_260px] gap-4 max-[900px]:grid-cols-1'>
				<div>
					<AnimePlayerFrame
						title={title}
						background={background}
						player={player}
					/>
					<AnimePlayerEpisodes episodes={episodes} />
					<div className='mt-4 grid gap-3 text-sm text-aw-text'>
						{player?.available && (
							<p className='m-0'>
								<span className='text-aw-subtle'>Kodik:</span>{' '}
								{player.translation}, {player.quality}
							</p>
						)}
						<p className='m-0'>
							<span className='text-aw-subtle'>Название:</span>{' '}
							{activeEpisodeTitle}
						</p>
						<p className='m-0'>
							<span className='text-aw-subtle'>Дата выхода:</span>{' '}
							{formattedDate}
						</p>
					</div>
				</div>
				<AnimePlayerTracks tracks={tracks} />
			</div>
		</section>
	)
}
