import { useStaticPage } from '@/features/static-pages/useStaticPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import type { StaticPageSlug } from '@/types/staticPage'
import { setPageMeta } from '@/utils/pageMeta'
import { parseStaticPageLinks } from '@/utils/staticPageMarkup'
import { useEffect } from 'react'

type StaticPageViewProps = {
	slug: StaticPageSlug
}

export function StaticPageView({ slug }: StaticPageViewProps) {
	const state = useStaticPage(slug)
	const page = state.page

	useEffect(() => {
		if (page) setPageMeta(page.title, page.content.slice(0, 160))
	}, [page])

	if (state.status === 'loading') return <StaticPageSkeleton />
	if (state.status === 'error' || !page) return <NotFoundPage />

	return (
		<div className='mx-auto grid max-w-345 gap-5 px-4 py-5 pb-10'>
			<section className='rounded-lg bg-aw-surface px-5 py-4 text-aw-text'>
				<h1 className='mb-4 text-3xl font-normal leading-tight'>{page.title}</h1>
				<div className='space-y-4 text-sm leading-relaxed'>
					{page.content.split(/\n{2,}/).map((paragraph, index) => (
						<p key={index}>
							{parseStaticPageLinks(paragraph).map((part, partIndex) =>
								part.type === 'link' ? (
									<a
										key={partIndex}
										href={part.href}
										className='text-aw-accent hover:underline'
									>
										{part.value}
									</a>
								) : (
									part.value
								),
							)}
						</p>
					))}
				</div>
			</section>
		</div>
	)
}

function StaticPageSkeleton() {
	return (
		<div className='mx-auto max-w-345 px-4 py-5 pb-10'>
			<div className='h-80 animate-pulse rounded-lg bg-aw-surface' />
		</div>
	)
}
