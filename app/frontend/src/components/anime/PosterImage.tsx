import { proxyImage } from '@/utils/imageProxy'
import { useEffect, useMemo, useRef, useState } from 'react'

type PosterImageProps = {
	url: string | undefined | null
	title: string
	className?: string
	placeholderClassName?: string
	loading?: 'lazy' | 'eager'
	fetchPriority?: 'high' | 'low' | 'auto'
	proxyWidth?: number
	onClick?: () => void
	maxRetries?: number
	retryDelay?: number
}

export function PosterImage({
	url,
	title,
	className = 'h-full w-full object-cover',
	placeholderClassName = 'flex h-full w-full items-center justify-center text-[clamp(20px,4vw,38px)] font-black text-white/60',
	loading = 'lazy',
	fetchPriority = 'auto',
	proxyWidth = 360,
	onClick,
	maxRetries = 5,
	retryDelay = 2000,
}: PosterImageProps) {
	const [isBroken, setIsBroken] = useState(false)
	const [retry, setRetry] = useState(0)
	const retryTimerRef = useRef<number | null>(null)

	useEffect(() => {
		setIsBroken(false)
		setRetry(0)

		if (retryTimerRef.current) {
			window.clearTimeout(retryTimerRef.current)
			retryTimerRef.current = null
		}
	}, [url])

	useEffect(() => {
		return () => {
			if (retryTimerRef.current) {
				window.clearTimeout(retryTimerRef.current)
			}
		}
	}, [])

	const src = useMemo(() => {
		if (!url) return null
		const urlWithRetry = addRetryParam(url, retry)

		return proxyImage(urlWithRetry, { width: proxyWidth })
	}, [proxyWidth, url, retry])

	function handleError() {
		if (retry < maxRetries) {
			retryTimerRef.current = window.setTimeout(() => {
				setRetry(value => value + 1)
			}, retryDelay)

			return
		}

		setIsBroken(true)
	}

	if (!src || isBroken) {
		return (
			<span
				className={placeholderClassName}
				aria-label={`${title} — постер недоступен`}
			>
				{getInitials(title)}
			</span>
		)
	}

	return (
		<img
			key={src}
			className={className}
			src={src}
			alt={`${title} постер`}
			loading={loading}
			fetchPriority={fetchPriority}
			decoding='async'
			onError={handleError}
			onLoad={() => setIsBroken(false)}
			onClick={onClick}
		/>
	)
}

function addRetryParam(url: string, retry: number): string {
	if (retry === 0) return url

	try {
		const parsedUrl = new URL(url)
		parsedUrl.searchParams.set('_poster_retry', String(retry))
		return parsedUrl.toString()
	} catch {
		const separator = url.includes('?') ? '&' : '?'
		return `${url}${separator}_poster_retry=${retry}`
	}
}

function getInitials(value: string): string {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(word => word[0]?.toUpperCase() ?? '')
		.join('')
}
