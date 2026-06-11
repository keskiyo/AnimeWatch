import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { AnimePage } from '@/pages/anime/AnimePage'
import { CatalogOngoingPage } from '@/pages/anime/CatalogOngoing'
import { CatalogPage } from '@/pages/anime/CatalogPage'
import { DubbingPage } from '@/pages/dubbing/DubbingPage'
import { AgreementPage } from '@/pages/footer/AgreementPage'
import { CopyrightPage } from '@/pages/footer/CopyrightPage'
import { PrivacyPage } from '@/pages/footer/PrivacyPage'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { UserProfilePage } from '@/pages/profile/UserProfilePage'
import { StudioPage } from '@/pages/studio/StudioPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

export function App() {
	return (
		<BrowserRouter>
			{/* Sticky footer: page content stretches, footer stays at the bottom */}
			<div className='flex min-h-dvh flex-col'>
				<Header />
				<div className='flex-1'>
					<Routes>
						<Route path='/' element={<HomePage />} />
						<Route path='/anime' element={<CatalogPage />} />
						<Route
							path='/ongoing'
							element={<CatalogOngoingPage />}
						/>
						<Route
							path='/anime/:animeSlug'
							element={<AnimePage />}
						/>
						<Route
							path='/studio/:studioName'
							element={<StudioPage />}
						/>
						<Route
							path='/dubbing/:translationId'
							element={<DubbingPage />}
						/>

						<Route path='/profile' element={<ProfilePage />} />
						<Route
							path='/profile/:userId'
							element={<UserProfilePage />}
						/>
						<Route path='/agreement' element={<AgreementPage />} />
						<Route path='/privacy' element={<PrivacyPage />} />
						<Route path='/copyright' element={<CopyrightPage />} />

						<Route path='*' element={<NotFoundPage />} />
					</Routes>
				</div>
				<Footer />
			</div>
		</BrowserRouter>
	)
}
