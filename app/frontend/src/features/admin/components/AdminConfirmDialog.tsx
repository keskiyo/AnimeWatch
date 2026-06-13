type AdminConfirmDialogProps = {
	title: string
	message: string
	confirmLabel: string
	isSubmitting: boolean
	onConfirm: () => void
	onClose: () => void
}

export function AdminConfirmDialog({
	title,
	message,
	confirmLabel,
	isSubmitting,
	onConfirm,
	onClose,
}: AdminConfirmDialogProps) {
	return (
		<div className='fixed inset-0 z-60 flex items-center justify-center bg-black/60 px-4'>
			<section className='w-full max-w-105 rounded-lg border border-aw-border bg-aw-surface p-5 shadow-2xl'>
				<h2 className='m-0 text-xl font-normal text-aw-text'>{title}</h2>
				<p className='m-0 mt-3 text-sm leading-relaxed text-aw-subtle'>
					{message}
				</p>
				<div className='mt-5 flex justify-end gap-3'>
					<button
						type='button'
						onClick={onClose}
						className='h-10 cursor-pointer rounded-md border border-aw-border bg-transparent px-4 text-aw-text hover:bg-aw-elevated'
					>
						Отмена
					</button>
					<button
						type='button'
						onClick={onConfirm}
						disabled={isSubmitting}
						className='h-10 cursor-pointer rounded-md border-0 bg-aw-accent px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60'
					>
						{confirmLabel}
					</button>
				</div>
			</section>
		</div>
	)
}
