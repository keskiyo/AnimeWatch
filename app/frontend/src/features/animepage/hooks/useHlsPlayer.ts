import { useEffect, useRef, useState, type RefObject } from 'react'

/** Attach an HLS stream to a <video>: native on Safari, hls.js elsewhere. */
export function useHlsPlayer(
	videoRef: RefObject<HTMLVideoElement | null>,
	url: string | null,
) {
	const [error, setError] = useState(false)
	// hls.js instance lives between renders; destroyed on url change/unmount
	const hlsRef = useRef<{ destroy: () => void } | null>(null)

	useEffect(() => {
		const video = videoRef.current
		setError(false)
		if (!video || !url) return

		let cancelled = false

		if (video.canPlayType('application/vnd.apple.mpegurl')) {
			video.src = url // Safari plays HLS natively
		} else {
			void import('hls.js').then(({ default: Hls }) => {
				if (cancelled || !videoRef.current) return
				if (!Hls.isSupported()) {
					setError(true)
					return
				}
				const hls = new Hls()
				hlsRef.current = hls
				hls.on(Hls.Events.ERROR, (_event, data) => {
					if (data.fatal) setError(true)
				})
				hls.loadSource(url)
				hls.attachMedia(videoRef.current)
			})
		}

		return () => {
			cancelled = true
			hlsRef.current?.destroy()
			hlsRef.current = null
		}
	}, [videoRef, url])

	return { error }
}
