export function formatCatalogAnimeType(value: string): string {
	const labels: Record<string, string> = {
		tv: 'Сериал',
		movie: 'Фильм',
		ova: 'OVA',
		ona: 'ONA',
		special: 'Спешл',
	}

	return labels[value] ?? value
}
