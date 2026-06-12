import { useHlsPlayer } from '@/features/animepage/hooks/useHlsPlayer'
import type { StreamSource } from '@/types/animePage'
import { MonitorX } from 'lucide-react'
import { useRef } from 'react'

type VideoPlayerProps = {
	source: StreamSource
	title: string
}

/** Stream player for backup providers: HLS via hls.js, MP4 natively. */
export function VideoPlayer({ source, title }: VideoPlayerProps) {
	if (source.kind === 'unsupported') {
		return (
			<StreamMessage text='Поток недоступен — попробуйте другую озвучку или плеер Kodik' />
		)
	}
	if (source.kind === 'mp4') {
		return (
			<video
				controls
				playsInline
				className='h-full w-full bg-black'
				title={title}
			>
				{source.urls.map(url => (
					<source key={url} src={url} type='video/mp4' />
				))}
			</video>
		)
	}
	return <HlsVideo url={source.url} title={title} />
}

function HlsVideo({ url, title }: { url: string; title: string }) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const { error } = useHlsPlayer(videoRef, url)

	if (error) {
		return (
			<StreamMessage text='Не удалось воспроизвести поток — попробуйте другую озвучку' />
		)
	}

	return (
		<video
			ref={videoRef}
			controls
			playsInline
			className='h-full w-full bg-black'
			title={title}
		/>
	)
}

function StreamMessage({ text }: { text: string }) {
	return (
		<div className='flex h-full w-full flex-col items-center justify-center gap-3 bg-black/60 px-6 text-center'>
			<MonitorX size={36} className='text-aw-subtle' aria-hidden='true' />
			<p className='m-0 text-sm text-aw-text'>{text}</p>
		</div>
	)
}
