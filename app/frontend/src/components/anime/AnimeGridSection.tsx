import { AnimeCard } from '@/features/catalog/components/AnimeCard'
import type { Anime } from '@/types/anime'

export type GridLoadState = 'idle' | 'loading' | 'done' | 'error'

type AnimeGridSectionProps = {
	loadState: GridLoadState
	anime: Anime[]
	displayCount: number
	onShowMore: () => void
	loadingText: string
	emptyText: string
}

const GRID_CLASSES =
	'grid grid-cols-4 gap-x-5 gap-y-7 max-[900px]:grid-cols-3 max-[640px]:grid-cols-2 max-[420px]:grid-cols-1'

/** Poster grid with loading / error / empty states and a "show more" button. */
export function AnimeGridSection({
	loadState,
	anime,
	displayCount,
	onShowMore,
	loadingText,
	emptyText,
}: AnimeGridSectionProps) {
	if (loadState === 'loading') {
		return (
			<div className='flex flex-col items-center gap-3 py-14 text-aw-subtle'>
				<div className='h-8 w-8 animate-spin rounded-full border-2 border-aw-border border-t-aw-accent' />
				<span className='text-sm'>{loadingText}</span>
			</div>
		)
	}

	if (loadState === 'error') {
		return (
			<div className='py-10 text-center text-sm text-aw-subtle'>
				Не удалось загрузить данные. Попробуйте позже.
			</div>
		)
	}

	const displayed = anime.slice(0, displayCount)
	const hasMore = displayCount < anime.length

	if (displayed.length === 0) {
		return (
			<div className='py-10 text-center text-sm text-aw-subtle'>
				{emptyText}
			</div>
		)
	}

	return (
		<>
			<div className={GRID_CLASSES}>
				{displayed.map(item => (
					<AnimeCard key={item.id} anime={item} variant='poster' />
				))}
			</div>

			{hasMore && (
				<div className='mt-8 flex items-center justify-center gap-3'>
					<button
						type='button'
						onClick={onShowMore}
						className='cursor-pointer rounded-md border border-aw-border bg-aw-elevated px-6 py-2.5 text-sm text-aw-text transition-colors hover:bg-aw-surface'
					>
						Показать ещё ({anime.length - displayCount})
					</button>
				</div>
			)}
		</>
	)
}
