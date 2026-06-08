export function formatAnimeRating(value: number): string {
	return value > 0 ? value.toFixed(1) : '—'
}
