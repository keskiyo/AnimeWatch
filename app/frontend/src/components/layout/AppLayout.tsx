import { getNotifications } from '@/api/animeApi'
import { Bell, Search } from 'lucide-react'
import { SyntheticEvent, useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

export function AppLayout() {
	const [search, setSearch] = useState('')
	const [unreadCount, setUnreadCount] = useState(0)
	const navigate = useNavigate()

	useEffect(() => {
		void getNotifications().then(items =>
			setUnreadCount(items.filter(item => !item.read).length),
		)
	}, [])

	function onSubmitSearch(event: SyntheticEvent<HTMLFormElement>) {
		event.preventDefault()
		const value = search.trim()
		navigate(
			value ? `/catalog?search=${encodeURIComponent(value)}` : '/catalog',
		)
	}

	return (
		<div className='grid min-h-screen grid-cols-[260px_minmax(0,1fr)] bg-aw-bg text-aw-text max-[860px]:grid-cols-1'>
			<aside className='border-r border-aw-border bg-aw-header p-4 max-[860px]:hidden'>
				<NavLink to='/' className='mb-8 flex items-center gap-3'>
					<span className='grid h-11 w-11 place-items-center overflow-hidden rounded-lg bg-aw-elevated'>
						<img
							className='h-full w-full object-cover'
							src='/AnimeWatch.png'
							alt=''
							aria-hidden='true'
						/>
					</span>
					<strong className='text-lg'>AnimeWatch</strong>
				</NavLink>
			</aside>
			<div className='min-w-0'>
				<header className='flex min-h-16 items-center justify-between gap-4 border-b border-aw-border bg-aw-header px-4'>
					<form
						className='flex min-h-10 w-full max-w-xl items-center gap-2 rounded-md border border-aw-border bg-aw-muted px-3'
						onSubmit={onSubmitSearch}
					>
						<Search aria-hidden='true' size={18} />
						<input
							className='min-w-0 flex-1 border-0 bg-transparent text-aw-text outline-none placeholder:text-aw-subtle'
							aria-label='Search anime'
							placeholder='Search anime'
							value={search}
							onChange={event => setSearch(event.target.value)}
						/>
					</form>
					<button
						className='relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-aw-border bg-aw-surface text-aw-text'
						aria-label={`${unreadCount} unread notifications`}
					>
						<Bell aria-hidden='true' size={18} />
						{unreadCount > 0 && (
							<span className='absolute -right-1 -top-1 rounded-full bg-aw-accent px-1.5 text-xs font-bold text-white'>
								{unreadCount}
							</span>
						)}
					</button>
				</header>
				<main className='p-6'>
					<Outlet />
				</main>
			</div>
		</div>
	)
}
