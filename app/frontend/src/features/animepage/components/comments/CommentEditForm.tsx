type CommentEditFormProps = {
	draft: string
	isBusy: boolean
	onDraftChange: (value: string) => void
	onCancel: () => void
	onSave: () => void
}

export function CommentEditForm({
	draft,
	isBusy,
	onDraftChange,
	onCancel,
	onSave,
}: CommentEditFormProps) {
	return (
		<div className='mt-1.5'>
			<textarea
				value={draft}
				onChange={e => onDraftChange(e.target.value)}
				maxLength={2000}
				className='h-24 w-full resize-none rounded-xl border border-aw-border bg-[#3a3a3a] px-3 py-2 text-aw-text outline-none focus:border-aw-accent'
			/>
			<div className='mt-1.5 flex gap-2'>
				<button
					type='button'
					onClick={onSave}
					disabled={isBusy || !draft.trim()}
					className='cursor-pointer rounded-md bg-aw-accent px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
				>
					Сохранить
				</button>
				<button
					type='button'
					onClick={onCancel}
					className='cursor-pointer rounded-md border border-aw-border bg-transparent px-3 py-1.5 text-sm text-aw-subtle transition-colors hover:text-aw-text'
				>
					Отмена
				</button>
			</div>
		</div>
	)
}
