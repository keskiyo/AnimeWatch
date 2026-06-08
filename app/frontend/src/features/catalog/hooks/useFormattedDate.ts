import { useMemo } from 'react'

export function useFormattedDate({
	activeEpisodeDate,
}: {
	activeEpisodeDate: string
}) {
	return useMemo(() => {
		if (!activeEpisodeDate) return ''

		try {
			const date = new Date(activeEpisodeDate)

			if (isNaN(date.getTime())) return activeEpisodeDate

			const formatted = new Intl.DateTimeFormat('ru-RU', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			}).format(date)

			return formatted.replace(' г.', '')
		} catch (error) {
			console.error('Ошибка форматирования даты:', error)
			return activeEpisodeDate
		}
	}, [activeEpisodeDate])
}
