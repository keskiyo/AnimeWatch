import { postAnimeComment } from '@/api/commentsApi'
import { openAuthModal } from '@/features/auth/authModalBus'
import { useAuthUser } from '@/features/auth/useAuthUser'
import type { AnimeComment } from '@/types/reviews'
import { Bold, Italic, SendHorizontal, Strikethrough, Underline } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'

const FORMATS = [
	{ label: 'Жирный', marker: '**', Icon: Bold },
	{ label: 'Курсив', marker: '*', Icon: Italic },
	{ label: 'Подчёркнутый', marker: '__', Icon: Underline },
	{ label: 'Зачёркнутый', marker: '~~', Icon: Strikethrough },
] as const

type CommentEditorProps = {
	animeId: number
	onPosted: (comment: AnimeComment) => void
}

/** Comment box: B/I/U/S toolbar, submit by button or Enter (Shift+Enter = newline). */
export function CommentEditor({ animeId, onPosted }: CommentEditorProps) {
	const { user } = useAuthUser()
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const [text, setText] = useState('')
	const [error, setError] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	function wrapSelection(marker: string) {
		const field = textareaRef.current
		if (!field) return
		const { selectionStart: start, selectionEnd: end } = field
		const next =
			text.slice(0, start) + marker + text.slice(start, end) + marker + text.slice(end)
		setText(next)
		requestAnimationFrame(() => {
			field.focus()
			field.setSelectionRange(start + marker.length, end + marker.length)
		})
	}

	async function submit() {
		const trimmed = text.trim()
		if (!trimmed || isSubmitting) return
		setIsSubmitting(true)
		setError('')
		try {
			const comment = await postAnimeComment(animeId, trimmed)
			setText('')
			onPosted(comment)
		} catch {
			setError('Не удалось отправить комментарий. Попробуйте позже.')
		} finally {
			setIsSubmitting(false)
		}
	}

	function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			void submit()
		}
	}

	return (
		<div>
			<div className='mb-2 flex items-center gap-1'>
				{FORMATS.map(({ label, marker, Icon }) => (
					<button
						key={label}
						type='button'
						title={label}
						aria-label={label}
						onClick={() => wrapSelection(marker)}
						className='inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-aw-subtle transition-colors hover:bg-aw-elevated hover:text-aw-text'
					>
						<Icon size={16} aria-hidden='true' />
					</button>
				))}
			</div>

			<textarea
				ref={textareaRef}
				value={text}
				disabled={!user || isSubmitting}
				onChange={e => setText(e.target.value)}
				onKeyDown={onKeyDown}
				maxLength={2000}
				placeholder={
					user ? 'Оставьте комментарий...' : 'Войдите, чтобы комментировать'
				}
				className='h-32 w-full resize-none rounded-2xl border border-aw-border bg-[#3a3a3a] px-4 py-3 text-aw-text outline-none transition-colors placeholder:text-aw-subtle focus:border-aw-accent disabled:cursor-not-allowed disabled:opacity-70'
			/>

			{user ? (
				<div className='mt-2 flex items-center justify-between gap-3'>
					<span className='text-xs text-aw-subtle'>
						Enter — отправить, Shift+Enter — новая строка
					</span>
					<button
						type='button'
						onClick={() => void submit()}
						disabled={isSubmitting || !text.trim()}
						className='inline-flex cursor-pointer items-center gap-2 rounded-md bg-aw-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
					>
						<SendHorizontal size={16} aria-hidden='true' />
						{isSubmitting ? 'Отправка…' : 'Отправить'}
					</button>
				</div>
			) : (
				<p className='m-0 mt-2 text-sm text-aw-text'>
					<button
						type='button'
						onClick={openAuthModal}
						className='cursor-pointer border-0 bg-transparent p-0 text-sm text-aw-accent underline underline-offset-2 hover:brightness-110'
					>
						Войдите
					</button>
					, чтобы Вы могли оставить комментарий
				</p>
			)}
			{error && <p className='m-0 mt-2 text-sm text-aw-accent'>{error}</p>}
		</div>
	)
}
