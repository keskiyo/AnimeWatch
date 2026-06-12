import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const CURRENT_YEAR = new Date().getFullYear()

function readSet(searchParams: URLSearchParams, key: string) {
	return new Set(searchParams.get(key)?.split(',').filter(Boolean) ?? [])
}

export function useCatalogFilterParams() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [resetKey, setResetKey] = useState(0)

	function updateParams(updater: (next: URLSearchParams) => void) {
		setSearchParams(
			prev => {
				const next = new URLSearchParams(prev)
				updater(next)
				return next
			},
			{ replace: true },
		)
	}

	function toggleSetParam(key: 'f' | 'genres', value: string) {
		updateParams(next => {
			const current = readSet(next, key)
			if (current.has(value)) current.delete(value)
			else current.add(value)

			if (current.size > 0) next.set(key, [...current].join(','))
			else next.delete(key)
		})
	}

	function toggleStrictMatch() {
		updateParams(next => {
			if (next.get('strict') === '1') next.delete('strict')
			else next.set('strict', '1')
		})
	}

	function setYear(key: 'fromYear' | 'toYear', year: number) {
		updateParams(next => {
			next.set(key, String(year))
		})
	}

	function resetFilters() {
		updateParams(next => {
			next.delete('f')
			next.delete('genres')
			next.delete('strict')
			next.delete('fromYear')
			next.delete('toYear')
		})
		setResetKey(key => key + 1)
	}

	return {
		checked: readSet(searchParams, 'f'),
		checkedGenres: readSet(searchParams, 'genres'),
		isStrictMatch: searchParams.get('strict') === '1',
		fromYear: Number(searchParams.get('fromYear') ?? '1980'),
		toYear: Number(searchParams.get('toYear') ?? CURRENT_YEAR),
		resetKey,
		onToggle: (value: string) => toggleSetParam('f', value),
		onToggleGenre: (value: string) => toggleSetParam('genres', value),
		onToggleStrictMatch: toggleStrictMatch,
		onFromYearChange: (year: number) => setYear('fromYear', year),
		onToYearChange: (year: number) => setYear('toYear', year),
		onClickResetFilters: resetFilters,
	}
}
