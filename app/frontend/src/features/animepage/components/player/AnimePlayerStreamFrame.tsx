import { VideoPlayer } from '@/features/animepage/components/player/VideoPlayer'
import type { StreamSource } from '@/types/animePage'

type AnimePlayerStreamFrameProps = {
	stream: StreamSource | null
	isLoading: boolean
	title: string
}

/** Frame for backup stream providers (AnimeGO): loading state + <VideoPlayer>. */
export function AnimePlayerStreamFrame({
	stream,
	isLoading,
	title,
}: AnimePlayerStreamFrameProps) {
	return (
		<div className='relative flex aspect-video min-h-75 items-center justify-center overflow-hidden rounded-sm bg-black'>
			{stream ? (
				<VideoPlayer source={stream} title={title} />
			) : isLoading ? (
				<div className='flex flex-col items-center gap-3 text-aw-subtle'>
					<span className='h-8 w-8 animate-spin rounded-full border-2 border-aw-border border-t-aw-accent' />
					<span className='text-sm'>Загрузка потока…</span>
				</div>
			) : (
				<p className='m-0 px-6 text-center text-sm text-aw-subtle'>
					Выберите озвучку во вкладке «Озвучка»
				</p>
			)}
		</div>
	)
}
