import type {
	CatalogAnime,
	CatalogFilterState,
	CatalogViewMode,
	CatalogViewModeOption,
	ClientFilters,
	FilterGroup,
	SortOption,
} from '@/types/catalog'

const CURRENT_YEAR = new Date().getFullYear()

export const TYPE_MAP: Record<string, string> = {
	Сериал: 'tv',
	Фильм: 'movie',
	OVA: 'ova',
	ONA: 'ona',
	Спешл: 'special',
}

export const STATUS_MAP: Record<string, string> = {
	Онгоинг: 'ongoing',
	Вышел: 'released',
	Анонс: 'announced',
	Недавно: 'recent',
}

export function parseClientFilters(searchParams: URLSearchParams): ClientFilters {
	const checkedRaw = searchParams.get('f')?.split(',').filter(Boolean) ?? []
	const genres = new Set(
		searchParams.get('genres')?.split(',').filter(Boolean) ?? [],
	)
	const isStrictMatch = searchParams.get('strict') === '1'
	const fromYear = Number(searchParams.get('fromYear') ?? '1980')
	const toYear = Number(searchParams.get('toYear') ?? CURRENT_YEAR)

	const types = new Set<string>()
	const statuses = new Set<string>()
	const ageRatings = new Set<string>()
	const episodeCounts = new Set<string>()

	for (const item of checkedRaw) {
		const colonIdx = item.indexOf(':')
		if (colonIdx < 0) continue
		const category = item.slice(0, colonIdx)
		const value = item.slice(colonIdx + 1)

		if (category === 'Тип') {
			const mapped = TYPE_MAP[value]
			if (mapped) types.add(mapped)
		} else if (category === 'Статус') {
			const mapped = STATUS_MAP[value]
			if (mapped) statuses.add(mapped)
		} else if (category === 'Возрастное ограничение') {
			ageRatings.add(value)
		} else if (category === 'Количество серий') {
			episodeCounts.add(value)
		}
	}

	return { types, statuses, ageRatings, episodeCounts, genres, isStrictMatch, fromYear, toYear }
}

export const NAV_ITEMS = ['Аниме', 'Онгоинг'] as const

export const CATALOG_INTRO_COLLAPSED = [
	'Перед вами полный каталог аниме, в котором собраны проекты самых разных форматов, жанров и годов выпуска. Здесь можно найти всё: длинные сериалы на сотни эпизодов, короткие сезонные новинки, полнометражные фильмы, OVA, ONA и специальные выпуски. Независимо от того, ищете ли вы популярный хит последних лет или хотите вспомнить классику, знакомую многим поклонникам японской анимации, этот раздел поможет быстро найти нужное аниме....',
] as const

export const CATALOG_INTRO_EXPANDED = [
	'Перед вами полный каталог аниме, в котором собраны проекты самых разных форматов, жанров и годов выпуска. Здесь можно найти всё: длинные сериалы на сотни эпизодов, короткие сезонные новинки, полнометражные фильмы, OVA, ONA и специальные выпуски. Независимо от того, ищете ли вы популярный хит последних лет или хотите вспомнить классику, знакомую многим поклонникам японской анимации, этот раздел поможет быстро найти нужное аниме.',
	'За десятилетия существования индустрии аниме появилось огромное количество историй, не похожих друг на друга. Одни рассказывают о путешествиях по фантастическим мирам, другие посвящены школьной жизни, спорту, романтике, детективным расследованиям или научной фантастике. Есть лёгкие комедии для отдыха после тяжёлого дня, есть серьёзные произведения с непростыми темами и запоминающимися персонажами. Именно поэтому аниме давно перестало быть развлечением для какой-то одной аудитории.',
	'В этом разделе представлены как современные работы, так и проекты прошлых лет, которые до сих пор остаются популярными среди зрителей. Для кого-то это возможность открыть для себя новые тайтлы, а для кого-то — вернуться к любимым историям и персонажам. Часто бывает так, что случайно найденное аниме оказывается намного интереснее того, которое изначально планировалось посмотреть.',
	'Каталог постоянно помогает ориентироваться в огромном количестве релизов и выбирать именно то, что подходит под текущее настроение. Хотите динамичный экшен, спокойную повседневность, напряжённый триллер или трогательную драму? Всё это можно найти здесь. Остаётся лишь выбрать аниме, которое привлечёт внимание, и познакомиться с очередной историей, созданной японскими авторами и аниматорами.',
] as const

export const STRICT_MATCH_TOOLTIP =
	'«Строгое совпадение» включено - в результатах будут отображаться только те тайтлы, которые одновременно относятся ко всем выбранным жанрам. «Строгое совпадение» отключено - в результатах будут показаны тайтлы, которые содержат хотя бы один из выбранных жанров.'

export const HOME_INTRO_TITLE = 'AnimeWatch — смотреть аниме онлайн бесплатно'

export const HOME_INTRO_PARAGRAPHS = [
	'Японская анимация давно стала частью мировой культуры. AnimeWatch собирает тайтлы разных жанров и форматов, чтобы было проще выбрать сериал, фильм, OVA или сезонную новинку без долгих поисков.',
	'Каталог помогает быстро ориентироваться по жанрам, статусу, длительности и другим параметрам. Здесь можно найти динамичный экшен, спокойную повседневность, романтику, драму, фантастику и классические работы прошлых лет.',
	'Мы делаем интерфейс быстрым, понятным и удобным на разных устройствах, чтобы поиск аниме занимал меньше времени, а просмотр начинался без лишних шагов.',
] as const

export const HOME_ADVANTAGES = [
	'Большой выбор аниме онлайн: популярные тайтлы прошлых лет, онгоинги, новинки и фильмы регулярно пополняют каталог.',
	'Удобная навигация: сортировка, фильтры и подборки помогают быстро найти аниме под настроение.',
	'Оценки и данные из Shikimori: карточки показывают актуальную информацию о тайтлах и их рейтинге.',
	'Минимум лишнего: AnimeWatch оставляет фокус на каталоге, карточках и быстром переходе к просмотру.',
] as const

export const HOME_FREE_TITLE =
	'На AnimeWatch — только бесплатные аниме без регистрации'

export const HOME_FREE_PARAGRAPHS = [
	'Главная идея AnimeWatch — сделать поиск и просмотр аниме доступным для каждого. Пользователю не нужно регистрироваться, чтобы открыть каталог и перейти к интересному тайтлу.',
	'Если вы любите японскую анимацию, AnimeWatch поможет быстрее найти подходящий сериал или фильм и вернуться к любимым историям.',
] as const

export const CATALOG_VIEW_MODES: CatalogViewModeOption[] = [
	{
		id: 'poster',
		label: 'Постеры',
		limit: 12,
	},
	{
		id: 'compact',
		label: 'Компактно',
		limit: 12,
	},
	{
		id: 'list',
		label: 'Список',
		limit: 12,
	},
]

export const sortOptions: SortOption[] = [
	'дате добавления',
	'новизне',
	'рейтингу',
]

export const GENRE_OPTIONS = [
	'CGDCT',
	'Авангард',
	'Антропоморфизм',
	'Боевые искусства',
	'Вампиры',
	'Взрослые персонажи',
	'Видеоигры',
	'Военное',
	'Выживание',
	'Гарем',
	'Гонки',
	'Городское фэнтези',
	'Гурман',
	'Гэг-юмор',
	'Детектив',
	'Детское',
	'Дзёсей',
	'Драма',
	'Жестокость',
	'Забота о детях',
	'Злодейка',
	'Игра с высокими ставками',
	'Идолы (Жен.)',
	'Идолы (Муж.)',
	'Изобразительное искусство',
	'Исполнительское искусство',
	'Исторический',
	'Исэкай',
	'Иясикэй',
	'Командный спорт',
	'Комедия',
	'Космос',
	'Кроссдрессинг',
	'Культура отаку',
	'Любовный многоугольник',
	'Магическая смена пола',
	'Махо-сёдзё',
	'Медицина',
	'Меха',
	'Мифология',
	'Музыка',
	'Образовательное',
	'Организованная преступность',
	'Пародия',
	'Питомцы',
	'Повседневность',
	'Приключения',
	'Психологическое',
	'Путешествие во времени',
	'Работа',
	'Реверс-гарем',
	'Реинкарнация',
	'Романтика',
	'Романтический подтекст',
	'Самураи',
	'Сверхъестественное',
	'Сёдзё',
	'Сёнен',
	'Спорт',
	'Спортивные единоборства',
	'Стратегические игры',
	'Супер сила',
	'Сэйнэн',
	'Тайна',
	'Триллер',
	'Ужасы',
	'Фантастика',
	'Фэнтези',
	'Хулиганы',
	'Школа',
	'Шоу-бизнес',
	'Экшен',
	'Эротика',
	'Этти',
] as const

export const filterGroups: FilterGroup[] = [
	{
		title: 'Тип',
		options: ['Сериал', 'Фильм', 'OVA', 'Спешл', 'ONA'],
	},
	{
		title: 'Статус',
		options: ['Онгоинг', 'Вышел', 'Анонс', 'Недавно'],
	},
	{
		title: 'Возрастное ограничение',
		options: ['G', 'PG', 'PG-13', 'R-17', 'R+'],
		hasInfo: 'Возрастное ограничение',
	},
	{
		title: 'Количество серий',
		options: ['Короткие', 'Средние', 'Длинные', 'Очень длинные'],
		hasInfo: 'Количество серий',
	},
]

export function filterGenreOptions(query: string): string[] {
	const normalizedQuery = query.trim().toLowerCase()

	if (!normalizedQuery) {
		return [...GENRE_OPTIONS]
	}

	return GENRE_OPTIONS.filter(genre =>
		genre.toLowerCase().includes(normalizedQuery),
	)
}

export function createEmptyCatalogFilterState(): CatalogFilterState {
	return {
		checked: new Set<string>(),
		checkedGenres: new Set<string>(),
		isStrictMatch: false,
	}
}

export function getCatalogViewState(
	mode: CatalogViewMode,
	anime: CatalogAnime[],
) {
	const viewMode =
		CATALOG_VIEW_MODES.find(item => item.id === mode) ??
		CATALOG_VIEW_MODES[0]!

	return {
		...viewMode,
		items: anime.slice(0, viewMode.limit),
	}
}

export function sortCatalogAnime(
	anime: CatalogAnime[],
	option: SortOption,
): CatalogAnime[] {
	return [...anime].sort((left, right) => {
		if (option === 'рейтингу') {
			return right.rating - left.rating
		}

		if (option === 'новизне') {
			return right.id - left.id
		}

		return (
			new Date(right.addedAt).getTime() - new Date(left.addedAt).getTime()
		)
	})
}
