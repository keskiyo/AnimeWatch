import { resolveAvatarUrl } from '@/api/authApi'
import { getPublicUser, type PublicUser } from '@/api/usersApi'
import { useAuthUser } from '@/features/auth/useAuthUser'
import { ProfileWatchlist } from '@/features/profile/components/watchlist/ProfileWatchlist'
import { setPageMeta } from '@/utils/pageMeta'
import { ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const FALLBACK_AVATAR = '/not-image.png'

type PageState =
	| { status: 'loading' }
	| { status: 'not-found' }
	| { status: 'ready'; profile: PublicUser }

/** Public profile of another user (/profile/:userId). */
export function UserProfilePage() {
	const { userId } = useParams()
	const id = userId ?? ''
	const { user } = useAuthUser()
	const navigate = useNavigate()
	const [state, setState] = useState<PageState>({ status: 'loading' })

	// Own profile → the private page with settings
	useEffect(() => {
		if (user && user.id === id) navigate('/profile', { replace: true })
	}, [user, id, navigate])

	useEffect(() => {
		if (!id) {
			setState({ status: 'not-found' })
			return
		}
		let isCancelled = false
		setState({ status: 'loading' })

		getPublicUser(id).then(profile => {
			if (isCancelled) return
			setState(
				profile ? { status: 'ready', profile } : { status: 'not-found' },
			)
			if (profile)
				setPageMeta({
					title: `${profile.name} — профиль на AnimeWatch`,
					noindex: true,
				})
		})

		return () => {
			isCancelled = true
		}
	}, [id])

	if (state.status === 'loading') {
		return (
			<main className='mx-auto max-w-345 px-4 py-6.5'>
				<section className='flex animate-pulse items-center gap-5 rounded-lg bg-aw-surface p-6'>
					<span className='h-24 w-24 rounded-full bg-aw-elevated' />
					<span className='h-7 w-48 rounded-md bg-aw-elevated' />
				</section>
			</main>
		)
	}

	if (state.status === 'not-found') {
		return (
			<main className='mx-auto max-w-345 px-4 py-6.5'>
				<section className='rounded-lg bg-aw-surface p-6 text-aw-subtle'>
					Пользователь не найден.
				</section>
			</main>
		)
	}

	const { profile } = state
	const registeredAt = profile.created_at
		? new Date(profile.created_at).toLocaleDateString('ru-RU', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			})
		: ''

	return (
		<main className='mx-auto grid max-w-345 gap-5 px-4 py-6.5 pb-10'>
			<section className='rounded-lg bg-aw-surface p-6'>
				<div className='flex flex-wrap items-center gap-5'>
					<img
						src={resolveAvatarUrl(profile.avatar_url) || FALLBACK_AVATAR}
						alt={`Аватар ${profile.name}`}
						className='h-24 w-24 rounded-full border-2 border-aw-border bg-aw-elevated object-cover'
						onError={e => {
							e.currentTarget.src = FALLBACK_AVATAR
						}}
					/>
					<div className='min-w-0'>
						<h1 className='m-0 flex items-center gap-2 text-3xl font-bold text-aw-text'>
							{profile.name}
							{profile.role === 'admin' && (
								<span className='inline-flex items-center gap-1 rounded bg-aw-accent/15 px-2 py-1 text-xs font-semibold text-aw-accent'>
									<ShieldCheck size={14} aria-hidden='true' />
									Admin
								</span>
							)}
						</h1>
						{registeredAt && (
							<p className='m-0 mt-1 text-sm text-aw-subtle'>
								На сайте с {registeredAt}
							</p>
						)}
					</div>
				</div>
			</section>
			<ProfileWatchlist userId={profile.id} />
		</main>
	)
}
