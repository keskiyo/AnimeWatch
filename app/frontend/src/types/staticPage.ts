export type StaticPageSlug = 'agreement' | 'privacy' | 'copyright'

export type StaticPage = {
	slug: StaticPageSlug
	title: string
	content: string
	updated_at: string
	updated_by: number | null
}
