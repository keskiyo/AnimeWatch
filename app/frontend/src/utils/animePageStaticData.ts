import type { AnimeFrame, AnimeScheduleRow } from '@/types/animePage'

export const DEFAULT_DESCRIPTION = [
	'Описание пока недоступно, но данные тайтла уже загружаются из внешнего каталога.',
] as const

export const ANIME_PAGE_FRAMES: AnimeFrame[] = [
	{
		id: 'frame-1',
		label: 'Кадр из эпизода',
		gradient:
			'linear-gradient(135deg,#27313a 0%,#718c82 42%,#e5d7aa 100%)',
	},
	{
		id: 'frame-2',
		label: 'Сцена',
		gradient:
			'linear-gradient(135deg,#82b65f 0%,#d6e8a9 45%,#6d8ca8 100%)',
	},
	{
		id: 'frame-3',
		label: 'Пейзаж',
		gradient:
			'linear-gradient(135deg,#b15d2d 0%,#e4b75a 46%,#28414a 100%)',
	},
	{
		id: 'frame-4',
		label: 'Небо',
		gradient:
			'linear-gradient(135deg,#7ecce9 0%,#d7eef6 48%,#f0d08e 100%)',
	},
]

export const ANIME_PAGE_SCHEDULE_ROWS: AnimeScheduleRow[] = [
	{
		episode: 'Следующая серия',
		title: 'Данные уточняются',
		releaseDate: 'Дата будет обновлена после подключения расписания',
		status: 'soon',
	},
]
