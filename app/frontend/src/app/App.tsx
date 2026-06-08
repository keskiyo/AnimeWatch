import { Header } from '@/components/layout/Header'
import { AnimePage } from '@/pages/AnimePage'
import { CatalogOngoingPage } from '@/pages/CatalogOngoing'
import { CatalogPage } from '@/pages/CatalogPage'
import { HomePage } from '@/pages/HomePage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

export function App() {
	return (
		<BrowserRouter>
			<Header />
			<Routes>
				<Route path='/' element={<HomePage />} />
				<Route path='/anime' element={<CatalogPage />} />
				<Route path='/ongoing' element={<CatalogOngoingPage />} />
				<Route path='/anime/:animeSlug' element={<AnimePage />} />
			</Routes>
		</BrowserRouter>
	)
}
