/** Run an API request, returning a neutral empty state on failure. */
export async function withFallback<T>(
	request: () => Promise<T>,
	fallback: T,
): Promise<T> {
	try {
		return await request()
	} catch (error) {
		console.warn('API request failed, neutral response used:', error)
		return fallback
	}
}
