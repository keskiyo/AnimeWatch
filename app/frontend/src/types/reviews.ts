/** Comment as stored/returned by the backend. */
export type AnimeComment = {
	id: string
	anime_id: number
	user_id: string
	parent_id?: string | null
	username: string
	avatar_url: string
	text: string
	created_at?: string
	likes: number
	dislikes: number
	/** Viewer's own vote: 1 like, -1 dislike, 0 none. */
	my_vote: number
}

export type CommentVoteResult = {
	likes: number
	dislikes: number
	my_vote: number
}
