import { AnimePlayerEpisodes } from '@/features/animepage/components/AnimePlayerEpisodes'
import { AnimePlayerFrame } from '@/features/animepage/components/AnimePlayerFrame'
import { useFormattedDate } from '@/features/catalog/hooks/useFormattedDate'
import type { KodikPlayer } from '@/types/anime'
import type {
	AnimePlayerEpisode,
	AnimePlayerTrack,
	PlayerProvider,
} from '@/types/animePage'
import { useState } from 'react'

type AnimePlayerProps = {
	title: string
	background: string
	tracks: AnimePlayerTrack[]
	episodes: AnimePlayerEpisode[]
	player?: KodikPlayer
	activeEpisodeTitle: string
	activeEpisodeDate: string
	ageRating?: string | number | null
	providers?: PlayerProvider[]
	activeTrackId?: string
	activeProviderId?: string
	onTrackChange?: (trackId: string) => void
	onProviderChange?: (providerId: string) => void
}

type SidebarTab = 'dubbing' | 'player'

// Converts Shikimori rating to a display label
function formatAgeRating(rating?: string | number | null): string | null {
	if (rating == null) return null
	const r = String(rating).toLowerCase().trim()
	if (/^\d+\+$/.test(r)) return r
	if (/^\d+$/.test(r)) return `${r}+`
	const map: Record<string, string> = {
		g: '0+',
		pg: '7+',
		'pg-13': '13+',
		r: '17+',
		'r+': '17+',
		rx: '18+',
	}
	return map[r] ?? String(rating)
}

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
	const [sidebarTab, setSidebarTab] = useState<SidebarTab>('dubbing')
	const [activeEpisode, setActiveEpisode] = useState(1)

	const displayRating = formatAgeRating(ageRating)

	return (
		<section>
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
					/>
					<AnimePlayerEpisodes
						episodes={episodes}
						activeEpisode={activeEpisode}
						onEpisodeChange={setActiveEpisode}
					/>
					<div className='mt-4 grid gap-3 text-sm text-aw-text'>
						{player?.available && (
							<p className='m-0'>
								<span className='text-aw-subtle'>Озвучка:</span>{' '}
								{player.translation}
								{player.quality && player.quality !== 'auto' && (
									<span className='ml-1.5 text-aw-subtle'>
										· {player.quality}
									</span>
								)}
							</p>
						)}
						<p className='m-0'>
							<span className='text-aw-subtle'>Серия:</span>{' '}
							{activeEpisode}
							{player?.available && player.episodes_count > 0 && (
								<span className='text-aw-subtle'>
									{' '}/ {player.episodes_count}
								</span>
							)}
						</p>
						{formattedDate && (
							<p className='m-0'>
								<span className='text-aw-subtle'>Следующий эпизод:</span>{' '}
								{formattedDate}
							</p>
						)}
					</div>
				</div>

				{/* Right: tabbed sidebar */}
				<div>
					{/* Tab header */}
					<div className='flex border-b border-aw-border'>
						<button
							type='button'
							onClick={() => setSidebarTab('dubbing')}
							className={[
								'px-0 pb-2 pr-4 text-sm font-medium transition-colors',
								sidebarTab === 'dubbing'
									? 'border-b-2 border-aw-accent text-aw-text'
									: 'border-b-2 border-transparent text-aw-subtle hover:text-aw-text',
							].join(' ')}
						>
							Озвучка
						</button>
						<button
							type='button'
							onClick={() => setSidebarTab('player')}
							className={[
								'px-4 pb-2 text-sm font-medium transition-colors',
								sidebarTab === 'player'
									? 'border-b-2 border-aw-accent text-aw-text'
									: 'border-b-2 border-transparent text-aw-subtle hover:text-aw-text',
							].join(' ')}
						>
							Плеер
						</button>
					</div>

					{/* Tab content */}
					<div className='mt-3'>
						{sidebarTab === 'dubbing' && (
							<div className='flex flex-col gap-1'>
								{tracks.length === 0 ? (
									<p className='text-sm text-aw-subtle'>
										Озвучки недоступны
									</p>
								) : (
									tracks.map(track => (
										<button
											key={track.id}
											type='button'
											onClick={() =>
												onTrackChange?.(track.id)
											}
											className={[
												'w-full rounded px-3 py-2 text-left text-sm transition-colors',
												activeTrackId === track.id
													? 'bg-aw-accent/15 text-aw-text'
													: 'text-aw-subtle hover:bg-aw-surface hover:text-aw-text',
											].join(' ')}
										>
											{track.label}
										</button>
									))
								)}
							</div>
						)}

						{sidebarTab === 'player' && (
							<div className='flex flex-col gap-1'>
								{providers.length === 0 ? (
									<p className='text-sm text-aw-subtle'>
										Плееры недоступны
									</p>
								) : (
									providers.map(provider => (
										<button
											key={provider.id}
											type='button'
											onClick={() =>
												onProviderChange?.(provider.id)
											}
											className={[
												'w-full rounded px-3 py-2 text-left text-sm transition-colors',
												activeProviderId === provider.id
													? 'bg-aw-accent/15 text-aw-text'
													: 'text-aw-subtle hover:bg-aw-surface hover:text-aw-text',
											].join(' ')}
										>
											{provider.label}
										</button>
									))
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	)
}
