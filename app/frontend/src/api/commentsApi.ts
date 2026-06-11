import { getAuthToken } from '@/api/authApi'
import { apiClient } from '@/api/client'
import type { AnimeComment, CommentVoteResult } from '@/types/reviews'

function authHeaders() {
	const token = getAuthToken()
	return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getAnimeComments(
	animeId: number,
): Promise<AnimeComment[]> {
	// Token (when present) lets the backend include my_vote
	const response = await apiClient.get<AnimeComment[]>(
		`/animes/${animeId}/comments`,
		{ headers: authHeaders() },
	)
	return response.data
}

export async function postAnimeComment(
	animeId: number,
	text: string,
	parentId?: number,
): Promise<AnimeComment> {
	const response = await apiClient.post<AnimeComment>(
		`/animes/${animeId}/comments`,
		{ text, parent_id: parentId ?? null },
		{ headers: authHeaders() },
	)
	return response.data
}

export async function voteAnimeComment(
	commentId: number,
	value: 1 | -1 | 0,
): Promise<CommentVoteResult> {
	const response = await apiClient.post<CommentVoteResult>(
		`/comments/${commentId}/vote`,
		{ value },
		{ headers: authHeaders() },
	)
	return response.data
}

export async function updateAnimeComment(
	commentId: number,
	text: string,
): Promise<AnimeComment> {
	const response = await apiClient.put<AnimeComment>(
		`/comments/${commentId}`,
		{ text },
		{ headers: authHeaders() },
	)
	return response.data
}

export async function deleteAnimeComment(commentId: number): Promise<void> {
	await apiClient.delete(`/comments/${commentId}`, { headers: authHeaders() })
}
