import type { InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 8000,
})

apiClient.interceptors.response.use(undefined, async error => {
	const config = error.config as
		| (InternalAxiosRequestConfig & { __retryCount?: number })
		| undefined
	const method = config?.method?.toLowerCase()
	const canRetry = method === 'get' || method === undefined
	const retryCount = config?.__retryCount ?? 0

	if (!config || !canRetry || retryCount >= 2) {
		throw error
	}

	const nextRetryCount = retryCount + 1
	config.__retryCount = nextRetryCount
	await new Promise(resolve => setTimeout(resolve, 200 * nextRetryCount))

	return apiClient.request(config)
})
