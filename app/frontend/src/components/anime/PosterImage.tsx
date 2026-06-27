import { proxyImage } from '@/utils/anime/imageProxy'
import { useEffect, useMemo, useRef, useState } from 'react'

/** Shown while the real poster loads and when it's missing or fails to load. */
const POSTER_PLACEHOLDER = '/not-poster.png'

type PosterImageProps = {
	url: string | undefined | null
	title: string
	className?: string
	/** @deprecated kept for call-site compatibility — placeholder is now an image. */
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
	loading = 'lazy',
	fetchPriority = 'auto',
	proxyWidth = 360,
	onClick,
	maxRetries = 3,
	retryDelay = 1500,
}: PosterImageProps) {
	const [isBroken, setIsBroken] = useState(false)
	const [isLoaded, setIsLoaded] = useState(false)
	const [retry, setRetry] = useState(0)
	const retryTimerRef = useRef<number | null>(null)

	useEffect(() => {
		setIsBroken(false)
		setIsLoaded(false)
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

	const showImage = Boolean(src) && !isBroken

	return (
		<span
			className='relative block h-full w-full overflow-hidden'
			onClick={onClick}
		>
			{/* Placeholder sits underneath: visible while loading, missing or broken. */}
			<img
				src={POSTER_PLACEHOLDER}
				alt=''
				aria-hidden='true'
				className='absolute inset-0 h-full w-full object-cover'
				loading={loading}
				decoding='async'
			/>

			{showImage && (
				<img
					key={src}
					className={`${className} absolute inset-0 transition-opacity duration-300 ${
						isLoaded ? 'opacity-100' : 'opacity-0'
					}`}
					src={src as string}
					alt={`${title} постер`}
					loading={loading}
					fetchPriority={fetchPriority}
					decoding='async'
					onError={handleError}
					onLoad={() => {
						setIsLoaded(true)
						setIsBroken(false)
					}}
				/>
			)}
		</span>
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
