import {
	useEpisodePages,
	VISIBLE_EPISODES,
} from '@/features/animepage/hooks/useEpisodePages'
import type { AnimePlayerEpisode } from '@/types/animePage'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type AnimePlayerEpisodesProps = {
	episodes: AnimePlayerEpisode[]
	activeEpisode?: number
	availableEpisodesCount?: number | null
	onEpisodeChange?: (episodeNumber: number) => void
}

export function AnimePlayerEpisodes({
	episodes,
	activeEpisode,
	availableEpisodesCount,
	onEpisodeChange,
}: AnimePlayerEpisodesProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [isPickerOpen, setIsPickerOpen] = useState(false)
	const [draftEpisode, setDraftEpisode] = useState('')
	const {
		displayEpisodes,
		pages,
		page,
		isPrevDisabled,
		isNextDisabled,
		handlePrev,
		handleNext,
	} = useEpisodePages({ episodes, activeEpisode, availableEpisodesCount })
	const firstEpisode = displayEpisodes[0]?.number ?? 1
	const lastEpisode = displayEpisodes.at(-1)?.number ?? 0

	useEffect(() => {
		if (activeEpisode !== undefined) setDraftEpisode(String(activeEpisode))
	}, [activeEpisode])

	useEffect(() => {
		if (isPickerOpen) inputRef.current?.focus()
	}, [isPickerOpen])

	function selectFromInput(value: string) {
		const numeric = value.replace(/\D/g, '')
		if (!numeric) {
			setDraftEpisode('')
			return
		}
		const episode = Number(numeric)
		const selected = episode > lastEpisode ? lastEpisode : episode
		setDraftEpisode(String(selected))
		if (selected >= firstEpisode) {
			onEpisodeChange?.(selected)
		}
	}

	if (displayEpisodes.length === 0) {
		return (
			<div className='mt-3 flex w-full items-center gap-5 pb-1 text-sm text-aw-subtle'>
				<span className='shrink-0 border-b border-dashed border-aw-subtle'>
					Серия №
				</span>
				<span>Серии пока недоступны</span>
			</div>
		)
	}

	return (
		<div className='relative mt-3 w-full pb-1 text-sm text-aw-text'>
			<div className='flex w-full items-center gap-5 overflow-hidden'>
				<div className='shrink-0'>
					<button
						type='button'
						onClick={() => setIsPickerOpen(value => !value)}
						className='cursor-pointer border-b border-dashed border-aw-subtle text-aw-subtle transition hover:text-aw-text'
						aria-expanded={isPickerOpen}
						aria-controls='episode-number-picker'
					>
						Серия №
					</button>
				</div>

				<div className='min-w-0 flex-1 overflow-hidden'>
					<div
						className='flex transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none'
						style={{
							transform: `translateX(-${page * 100}%)`,
						}}
					>
						{pages.map((pageEpisodes, pageIndex) => (
							<div
								key={pageIndex}
								className='grid w-full shrink-0 gap-5'
								style={{
									gridTemplateColumns: `repeat(${VISIBLE_EPISODES}, minmax(0, 1fr))`,
								}}
							>
								{pageEpisodes.map(episode => {
									const isActive =
										activeEpisode !== undefined
											? episode.number === activeEpisode
											: episode.isActive

									const episodeTitle =
										episode.title ?? `Серия ${episode.number}`

									return (
										<button
											key={episode.number}
											type='button'
											title={episodeTitle}
											aria-label={episodeTitle}
											onClick={() =>
												onEpisodeChange?.(episode.number)
											}
											className={[
												'h-12 w-full cursor-pointer rounded-2xl px-6 text-base transition-colors duration-200',
												isActive
													? 'bg-[#4f5052] text-aw-accent'
													: 'bg-transparent text-aw-text hover:bg-aw-elevated',
											].join(' ')}
										>
											{episode.number}
										</button>
									)
								})}
							</div>
						))}
					</div>
				</div>

				{pages.length > 1 && (
					<div className='ml-auto flex shrink-0 items-center border-l border-aw-border pl-4'>
						<button
							type='button'
							onClick={handlePrev}
							disabled={isPrevDisabled}
							className='inline-flex h-10 w-10 cursor-pointer items-center justify-center text-aw-subtle transition-colors hover:text-aw-text disabled:cursor-not-allowed disabled:opacity-30'
							title='Предыдущие серии'
						>
							<ChevronLeft size={30} aria-hidden='true' />
						</button>

						<button
							type='button'
							onClick={handleNext}
							disabled={isNextDisabled}
							className='inline-flex h-10 w-10 cursor-pointer items-center justify-center text-aw-subtle transition-colors hover:text-aw-text disabled:cursor-not-allowed disabled:opacity-30'
							title='Следующие серии'
						>
							<ChevronRight size={30} aria-hidden='true' />
						</button>
					</div>
				)}
			</div>

			{isPickerOpen && (
				<div
					id='episode-number-picker'
					className='absolute left-0 top-full z-20 mt-2 w-40 rounded-md border border-aw-border bg-aw-elevated p-2 shadow-xl'
				>
					<input
						ref={inputRef}
						type='text'
						inputMode='numeric'
						pattern='[0-9]*'
						value={draftEpisode}
						onChange={event => selectFromInput(event.target.value)}
						onBlur={() => setIsPickerOpen(false)}
						placeholder={`${firstEpisode}-${lastEpisode}`}
						aria-label='Номер серии'
						className='h-9 w-full rounded border border-aw-border bg-aw-surface px-2 text-center text-base text-aw-text outline-none focus:border-aw-accent'
					/>
					<span
						className='mt-1 block text-center text-xs text-aw-subtle'
						aria-hidden='true'
					>
						{firstEpisode}-{lastEpisode}
					</span>
				</div>
			)}
		</div>
	)
}
