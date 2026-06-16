export function formatAnimeRating(value: number): string {
	return value > 0 ? value.toFixed(1) : '—'
}

export function getAnimeRatingColor(rating: number): string {
	if (rating <= 0) return 'bg-aw-elevated text-aw-subtle'
	if (rating >= 7) return 'bg-[#2fc244] text-white'
	if (rating >= 4) return 'bg-[#e8a020] text-white'
	return 'bg-[#e53e3e] text-white'
}
