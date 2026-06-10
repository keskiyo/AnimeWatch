/** Returns true when the app should skip the API and use local fallbacks. */
function shouldUseFallback() {
	const envFallback = import.meta.env.VITE_USE_FALLBACK === 'true'

	if (typeof window === 'undefined') {
		return envFallback
	}

	const localFallback = localStorage.getItem('useFallback') === 'true'

	return envFallback || localFallback
}

/** Run an API request, returning `fallback` on failure or in fallback mode. */
export async function withFallback<T>(
	request: () => Promise<T>,
	fallback: T,
): Promise<T> {
	if (shouldUseFallback()) {
		return fallback
	}

	try {
		return await request()
	} catch (error) {
		console.warn('API request failed, fallback used:', error)
		return fallback
	}
}
