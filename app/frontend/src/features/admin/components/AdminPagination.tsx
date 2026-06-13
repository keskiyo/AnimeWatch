type AdminPaginationProps = {
	page: number
	total: number
	limit: number
	onPageChange: (page: number) => void
}

export function AdminPagination({
	page,
	total,
	limit,
	onPageChange,
}: AdminPaginationProps) {
	const maxPage = Math.max(1, Math.ceil(total / limit))
	return (
		<div className='mt-4 flex items-center justify-end gap-3 text-sm text-aw-subtle'>
			<span>
				Страница {page} из {maxPage}
			</span>
			<button
				type='button'
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				className='h-9 cursor-pointer rounded-md border border-aw-border px-3 text-aw-text disabled:cursor-not-allowed disabled:opacity-50'
			>
				Назад
			</button>
			<button
				type='button'
				disabled={page >= maxPage}
				onClick={() => onPageChange(page + 1)}
				className='h-9 cursor-pointer rounded-md border border-aw-border px-3 text-aw-text disabled:cursor-not-allowed disabled:opacity-50'
			>
				Вперед
			</button>
		</div>
	)
}
