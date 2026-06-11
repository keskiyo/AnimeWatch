import { useAuthUser } from '@/features/auth/useAuthUser'
import { AvatarUpload } from '@/features/profile/components/AvatarUpload'
import { ChangePasswordForm } from '@/features/profile/components/ChangePasswordForm'
import { setPageMeta } from '@/utils/pageMeta'
import { LogOut, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function ProfilePage() {
	const { user, isInitialized, logout } = useAuthUser()
	const navigate = useNavigate()

	useEffect(() => {
		setPageMeta('Профиль — AnimeWatch')
	}, [])

	// Not logged in → back to home (wait for the session check first)
	useEffect(() => {
		if (isInitialized && !user) navigate('/', { replace: true })
	}, [isInitialized, user, navigate])

	if (!user) {
		return (
			<main className='mx-auto max-w-345 px-4 py-8'>
				<section className='animate-pulse rounded-lg bg-aw-surface p-6'>
					<div className='h-24 w-24 rounded-full bg-aw-elevated' />
					<div className='mt-4 h-6 w-48 rounded-md bg-aw-elevated' />
				</section>
			</main>
		)
	}

	async function onLogout() {
		await logout()
		navigate('/')
	}

	const registeredAt = new Date(user.created_at).toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})

	return (
		<main className='mx-auto grid max-w-345 gap-5 px-4 py-6.5 pb-10'>
			<section className='rounded-lg bg-aw-surface p-6'>
				<div className='flex flex-wrap items-center gap-5'>
					<AvatarUpload user={user} />
					<div className='min-w-0'>
						<h1 className='m-0 flex items-center gap-2 text-3xl font-bold text-aw-text'>
							{user.name}
							{user.role === 'admin' && (
								<span className='inline-flex items-center gap-1 rounded bg-aw-accent/15 px-2 py-1 text-xs font-semibold text-aw-accent'>
									<ShieldCheck size={14} aria-hidden='true' />
									Admin
								</span>
							)}
						</h1>
						<p className='m-0 mt-1 text-aw-subtle'>{user.email}</p>
						<p className='m-0 mt-1 text-sm text-aw-subtle'>
							На сайте с {registeredAt}
						</p>
					</div>
					<button
						type='button'
						onClick={onLogout}
						className='ml-auto inline-flex cursor-pointer items-center gap-2 rounded-md border border-aw-border bg-aw-elevated px-4 py-2 text-sm text-aw-text transition-colors hover:border-aw-accent hover:text-aw-accent'
					>
						<LogOut size={16} aria-hidden='true' />
						Выйти
					</button>
				</div>
			</section>

			<section className='rounded-lg bg-aw-surface p-6'>
				<ChangePasswordForm />
			</section>
		</main>
	)
}
