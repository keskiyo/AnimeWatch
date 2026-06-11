import { apiUploadAvatar, resolveAvatarUrl } from '@/api/authApi'
import { useAuthUser } from '@/features/auth/useAuthUser'
import type { AuthUser } from '@/types/auth'
import { notifyError, notifySuccess } from '@/utils/notify'
import { Camera } from 'lucide-react'
import { useRef, useState } from 'react'

const FALLBACK_AVATAR = '/not-image.png'
const MAX_SIZE_BYTES = 5 * 1024 * 1024

type AvatarUploadProps = {
	user: AuthUser
}

/** Round avatar with an upload button — image is optimised server-side. */
export function AvatarUpload({ user }: AvatarUploadProps) {
	const { refresh } = useAuthUser()
	const inputRef = useRef<HTMLInputElement>(null)
	const [isUploading, setIsUploading] = useState(false)

	async function onFileSelected(file: File | undefined) {
		if (!file) return
		if (!file.type.startsWith('image/')) {
			notifyError('Выберите изображение')
			return
		}
		if (file.size > MAX_SIZE_BYTES) {
			notifyError('Файл больше 5 МБ')
			return
		}

		setIsUploading(true)
		try {
			await apiUploadAvatar(file)
			await refresh() // new avatar_url (with cache-bust version)
			notifySuccess('Аватар обновлён')
		} catch {
			notifyError('Не удалось загрузить аватар')
		} finally {
			setIsUploading(false)
			if (inputRef.current) inputRef.current.value = ''
		}
	}

	return (
		<div className='grid justify-items-center gap-1.5'>
			<div className='group relative h-24 w-24'>
				<img
					src={resolveAvatarUrl(user.avatar_url) || FALLBACK_AVATAR}
					alt={`Аватар ${user.name}`}
					className={`h-24 w-24 rounded-full border-2 border-aw-border bg-aw-elevated object-cover ${isUploading ? 'opacity-50' : ''}`}
					onError={e => {
						e.currentTarget.src = FALLBACK_AVATAR
					}}
				/>
				<button
					type='button'
					onClick={() => inputRef.current?.click()}
					disabled={isUploading}
					aria-label='Загрузить аватар'
					className='absolute -bottom-1 -right-1 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-aw-border bg-aw-accent text-white shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'
				>
					<Camera size={16} aria-hidden='true' />
				</button>
				<input
					ref={inputRef}
					type='file'
					accept='image/jpeg,image/png,image/webp,image/gif'
					className='hidden'
					onChange={e => onFileSelected(e.target.files?.[0])}
				/>
			</div>
			{isUploading && (
				<span className='text-xs text-aw-subtle'>Загрузка…</span>
			)}
		</div>
	)
}
