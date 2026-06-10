import { AnimeCard } from '@/features/catalog/components/AnimeCard'
import { useAnimeCatalog } from '@/features/catalog/hooks/useAnimeCatalog'
import { CatalogViewMode } from '@/types/catalog'

const GRID_CLASSES: Record<CatalogViewMode, string> = {
	poster: 'grid grid-cols-4 gap-x-5 gap-y-7 max-[900px]:grid-cols-3 max-[640px]:grid-cols-2 max-[420px]:grid-cols-1',
	compact: 'grid grid-cols-2 gap-x-5 gap-y-7 max-[900px]:grid-cols-1',
	list: 'grid grid-cols-1 gap-x-5 gap-y-7',
}

export function CatalogBody({
	viewMode,
	catalog,
	emptyText = 'В каталоге пока ничего нет.',
}: {
	viewMode: CatalogViewMode
	catalog: ReturnType<typeof useAnimeCatalog>
	emptyText?: string
}) {
	if (catalog.isInitialLoading) {
		return (
			<div className='py-10 text-center text-aw-subtle'>
				Загрузка каталога...
			</div>
		)
	}

	if (catalog.error) {
		return (
			<div className='py-10 text-center text-aw-subtle'>
				{catalog.error}
			</div>
		)
	}

	if (catalog.anime.length === 0) {
		return (
			<div className='py-10 text-center text-aw-subtle'>{emptyText}</div>
		)
	}

	return (
		<div className={GRID_CLASSES[viewMode]}>
			{catalog.anime.map(anime => (
				<AnimeCard key={anime.id} anime={anime} variant={viewMode} />
			))}
		</div>
	)
}
