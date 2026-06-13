import type { AdminStaticPage } from '@/types/admin'
import { SyntheticEvent, useEffect, useState } from 'react'

type AdminPagesPanelProps = {
	pages: AdminStaticPage[]
	isLoading: boolean
	isError: boolean
	isSaving: boolean
	onSave: (
		page: AdminStaticPage,
		title: string,
		content: string,
	) => Promise<void>
}

export function AdminPagesPanel(props: AdminPagesPanelProps) {
	const { pages, isLoading, isError, isSaving, onSave } = props
	const [activeSlug, setActiveSlug] =
		useState<AdminStaticPage['slug']>('agreement')
	const active = pages.find(page => page.slug === activeSlug) ?? pages[0]

	if (isLoading && pages.length === 0) return <PagesSkeleton />
	if (isError)
		return (
			<p className='rounded-md bg-aw-muted p-4 text-aw-accent'>
				Не удалось загрузить страницы
			</p>
		)
	if (!active) return <p className='text-aw-subtle'>Страницы не найдены</p>

	return (
		<div className='grid gap-4 pt-7 lg:grid-cols-[240px_1fr]'>
			<div className='flex gap-2 overflow-x-auto lg:block lg:space-y-2'>
				{pages.map(page => (
					<button
						key={page.slug}
						type='button'
						onClick={() => setActiveSlug(page.slug)}
						className={`flex min-h-10 w-60 shrink-0 cursor-pointer items-center rounded-md border px-3 py-2 text-left text-sm leading-snug lg:w-full ${
							page.slug === active.slug
								? 'border-aw-accent text-aw-accent'
								: 'border-aw-border text-aw-text hover:border-aw-accent'
						}`}
					>
						{page.title}
					</button>
				))}
			</div>
			<PageEditor
				key={active.slug}
				page={active}
				isSaving={isSaving}
				onSave={onSave}
			/>
		</div>
	)
}

function PageEditor({
	page,
	isSaving,
	onSave,
}: {
	page: AdminStaticPage
	isSaving: boolean
	onSave: AdminPagesPanelProps['onSave']
}) {
	const [title, setTitle] = useState(page.title)
	const [content, setContent] = useState(page.content)
	useEffect(() => {
		setTitle(page.title)
		setContent(page.content)
	}, [page])

	function handleSubmit(event: SyntheticEvent) {
		event.preventDefault()
		void onSave(page, title, content)
	}

	return (
		<form onSubmit={handleSubmit} className='grid gap-3'>
			<input
				value={title}
				onChange={event => setTitle(event.target.value)}
				className='h-10 rounded-md border border-aw-border bg-aw-elevated px-3 text-aw-text outline-none focus:border-aw-accent'
			/>
			<textarea
				value={content}
				onChange={event => setContent(event.target.value)}
				rows={16}
				className='resize-y rounded-md border border-aw-border bg-aw-elevated p-3 text-sm leading-relaxed text-aw-text outline-none focus:border-aw-accent'
			/>
			<p className='m-0 text-sm text-aw-subtle'>
				Ссылки вставляются в формате: [текст
				ссылки](https://example.com).
			</p>
			<button
				type='submit'
				disabled={isSaving}
				className='h-10 w-fit cursor-pointer rounded-md bg-aw-accent px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60'
			>
				Сохранить
			</button>
		</form>
	)
}

function PagesSkeleton() {
	return <div className='h-96 animate-pulse rounded-md bg-aw-elevated' />
}
