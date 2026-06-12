import type { AnimePlayerEpisode } from '@/types/animePage'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

type AnimePlayerMobileControlsProps = {
	episodes: AnimePlayerEpisode[]
	activeEpisode: number
	availableEpisodesCount: number
	activeTrackLabel?: string
	activeProviderLabel?: string
	onEpisodeChange: (episodeNumber: number) => void
	onOpenOptions: () => void
}

export function AnimePlayerMobileControls({
	episodes,
	activeEpisode,
	availableEpisodesCount,
	activeTrackLabel,
	activeProviderLabel,
	onEpisodeChange,
	onOpenOptions,
}: AnimePlayerMobileControlsProps) {
	const [isEpisodeOpen, setIsEpisodeOpen] = useState(false)
	const displayEpisodes = useMemo(() => {
		if (availableEpisodesCount <= 0) return []
		return episodes.slice(0, availableEpisodesCount)
	}, [availableEpisodesCount, episodes])
	const hasEpisodes = displayEpisodes.length > 0
	const firstEpisode = displayEpisodes[0]?.number ?? activeEpisode
	const lastEpisode = displayEpisodes.at(-1)?.number ?? activeEpisode
	const activeLabel = hasEpisodes ? `${activeEpisode} серия` : 'Нет серий'
	const canPrev = hasEpisodes && activeEpisode > firstEpisode
	const canNext = hasEpisodes && activeEpisode < lastEpisode
	const optionsLabel = [activeTrackLabel, activeProviderLabel]
		.filter(Boolean)
		.join(' · ')

	function selectEpisode(episode: number) {
		onEpisodeChange(episode)
		setIsEpisodeOpen(false)
	}

	return (
		<div className='mt-2 grid gap-3'>
			<div className='relative grid grid-cols-[66px_minmax(0,1fr)_66px] gap-2'>
				<StepButton
					label='Предыдущая серия'
					disabled={!canPrev}
					onClick={() => selectEpisode(activeEpisode - 1)}
				>
					<ChevronLeft size={20} aria-hidden='true' />
				</StepButton>
				<button
					type='button'
					disabled={!hasEpisodes}
					onClick={() => setIsEpisodeOpen(value => !value)}
					className='h-10 min-w-0 cursor-pointer rounded-xl border border-aw-border bg-aw-elevated px-4 text-left text-base text-aw-text disabled:cursor-not-allowed disabled:opacity-50'
				>
					{activeLabel}
				</button>
				<StepButton
					label='Следующая серия'
					disabled={!canNext}
					onClick={() => selectEpisode(activeEpisode + 1)}
				>
					<ChevronRight size={20} aria-hidden='true' />
				</StepButton>

				{isEpisodeOpen && hasEpisodes && (
					<div className='absolute bottom-12 left-16 right-16 z-30 max-h-72 overflow-y-auto rounded-md border border-aw-border bg-aw-elevated p-1 shadow-xl'>
						{displayEpisodes.map(episode => (
							<button
								key={episode.number}
								type='button'
								onClick={() => selectEpisode(episode.number)}
								className={`block h-9 w-full cursor-pointer rounded px-3 text-left text-base ${
									episode.number === activeEpisode
										? 'bg-[#555658] text-aw-text'
										: 'text-aw-text hover:bg-aw-surface'
								}`}
							>
								{episode.number} серия
							</button>
						))}
					</div>
				)}
			</div>

			<button
				type='button'
				onClick={onOpenOptions}
				className='flex h-10 cursor-pointer items-center justify-between rounded-md border border-aw-border bg-transparent px-3 text-left text-base text-aw-text hover:border-aw-accent'
			>
				<span className='truncate'>{optionsLabel || 'Озвучка и плеер'}</span>
				<span className='text-aw-subtle'>Выбрать</span>
			</button>
		</div>
	)
}

function StepButton({
	label,
	disabled,
	onClick,
	children,
}: {
	label: string
	disabled: boolean
	onClick: () => void
	children: ReactNode
}) {
	return (
		<button
			type='button'
			aria-label={label}
			disabled={disabled}
			onClick={onClick}
			className='inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-aw-border bg-transparent text-aw-subtle hover:border-aw-accent hover:text-aw-text disabled:cursor-not-allowed disabled:opacity-40'
		>
			{children}
		</button>
	)
}
