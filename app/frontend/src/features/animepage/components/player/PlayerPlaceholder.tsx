import { KodikPlayer } from '@/types/anime'
import { CalendarClock, Play, VideoOff } from 'lucide-react'

type PlayerPlaceholderProps = {
	player?: KodikPlayer
	availableEpisodesCount: number
	nextEpisodeDate?: string | null
}

export function PlayerPlaceholder({
	player,
	availableEpisodesCount,
	nextEpisodeDate,
}: PlayerPlaceholderProps) {
	const hasEpisodes = availableEpisodesCount > 0
	const isUnavailable = player?.available === false

	const title = !hasEpisodes
		? 'Серии пока недоступны'
		: isUnavailable
			? 'Плеер временно недоступен'
			: 'Плеер загружается'

	const description = !hasEpisodes
		? 'Как только появятся доступные серии, здесь отобразится плеер и выбор эпизодов.'
		: isUnavailable
			? 'Мы не нашли доступный плеер для этого аниме. Попробуйте позже или выберите другой источник, если он доступен.'
			: 'Пожалуйста, подождите несколько секунд.'

	const Icon = !hasEpisodes ? CalendarClock : isUnavailable ? VideoOff : Play

	return (
		<>
			<div className='absolute inset-0 bg-black/60 backdrop-blur-[2px]' />
			<div className='absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.55))]' />

			<div className='relative mx-6 grid max-w-120 justify-items-center gap-4 rounded-2xl border border-white/10 bg-black/35 px-8 py-7 text-center shadow-2xl backdrop-blur-md'>
				<span className='flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10 text-aw-text'>
					<Icon
						size={32}
						fill={
							!hasEpisodes || isUnavailable
								? 'none'
								: 'currentColor'
						}
						className={
							!hasEpisodes || isUnavailable
								? ''
								: 'translate-x-0.5'
						}
						aria-hidden='true'
					/>
				</span>

				<div className='grid gap-2'>
					<p className='m-0 text-lg font-medium text-aw-text'>
						{title}
					</p>

					<p className='m-0 text-sm leading-relaxed text-aw-subtle'>
						{description}
					</p>

					{!hasEpisodes && nextEpisodeDate && (
						<p className='m-0 text-sm text-aw-text'>
							Следующий эпизод: {nextEpisodeDate}
						</p>
					)}
				</div>
			</div>
		</>
	)
}
