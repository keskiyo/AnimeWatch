import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { lazy, Suspense } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

const AdminPage = lazy(() =>
	import('@/pages/admin/AdminPage').then(module => ({ default: module.AdminPage })),
)
const AnimePage = lazy(() =>
	import('@/pages/anime/AnimePage').then(module => ({ default: module.AnimePage })),
)
const CatalogOngoingPage = lazy(() =>
	import('@/pages/anime/CatalogOngoing').then(module => ({ default: module.CatalogOngoingPage })),
)
const CatalogPage = lazy(() =>
	import('@/pages/anime/CatalogPage').then(module => ({ default: module.CatalogPage })),
)
const DubbingPage = lazy(() =>
	import('@/pages/dubbing/DubbingPage').then(module => ({ default: module.DubbingPage })),
)
const AgreementPage = lazy(() =>
	import('@/pages/footer/AgreementPage').then(module => ({ default: module.AgreementPage })),
)
const CopyrightPage = lazy(() =>
	import('@/pages/footer/CopyrightPage').then(module => ({ default: module.CopyrightPage })),
)
const PrivacyPage = lazy(() =>
	import('@/pages/footer/PrivacyPage').then(module => ({ default: module.PrivacyPage })),
)
const ProfilePage = lazy(() =>
	import('@/pages/profile/ProfilePage').then(module => ({ default: module.ProfilePage })),
)
const UserProfilePage = lazy(() =>
	import('@/pages/profile/UserProfilePage').then(module => ({ default: module.UserProfilePage })),
)
const StudioPage = lazy(() =>
	import('@/pages/studio/StudioPage').then(module => ({ default: module.StudioPage })),
)

export function App() {
	return (
		<BrowserRouter>
			<div className='flex min-h-dvh flex-col'>
				<Header />
				<div className='flex-1'>
					<Suspense fallback={<PageSkeleton />}>
						<Routes>
							<Route path='/' element={<HomePage />} />
							<Route path='/admin' element={<AdminPage />} />
							<Route path='/anime' element={<CatalogPage />} />
							<Route path='/ongoing' element={<CatalogOngoingPage />} />
							<Route path='/anime/:animeSlug' element={<AnimePage />} />
							<Route path='/studio/:studioName' element={<StudioPage />} />
							<Route path='/dubbing/:translationId' element={<DubbingPage />} />
							<Route path='/profile' element={<ProfilePage />} />
							<Route path='/profile/:userId' element={<UserProfilePage />} />
							<Route path='/agreement' element={<AgreementPage />} />
							<Route path='/privacy' element={<PrivacyPage />} />
							<Route path='/copyright' element={<CopyrightPage />} />
							<Route path='*' element={<NotFoundPage />} />
						</Routes>
					</Suspense>
				</div>
				<Footer />
				<ToastContainer
					theme='dark'
					position='top-right'
					autoClose={2200}
				/>
			</div>
		</BrowserRouter>
	)
}

function PageSkeleton() {
	return (
		<main className='mx-auto max-w-345 px-4 py-6'>
			<div className='h-80 animate-pulse rounded-lg bg-aw-surface' />
		</main>
	)
}
