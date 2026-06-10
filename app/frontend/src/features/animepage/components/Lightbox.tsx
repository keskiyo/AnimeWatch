import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type LightboxProps = {
	src: string
	alt: string
	onClose: () => void
}

export function Lightbox({ src, alt, onClose }: LightboxProps) {
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', onKey)

		// Prevent body from scrolling while lightbox is open
		const prevOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'

		return () => {
			document.removeEventListener('keydown', onKey)
			document.body.style.overflow = prevOverflow
		}
	}, [onClose])

	return createPortal(
		<div
			role='dialog'
			aria-modal='true'
			aria-label={alt}
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4'
			style={{ animation: 'lbFadeIn 0.2s ease-out' }}
			onClick={onClose}
		>
			{/* Close button */}
			<button
				type='button'
				className='absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20'
				onClick={onClose}
				aria-label='Закрыть'
			>
				<X size={20} aria-hidden='true' />
			</button>

			{/* Image — click on it does NOT close the lightbox */}
			<img
				src={src}
				alt={alt}
				className='max-h-[90vh] max-w-[90vw] cursor-zoom-out rounded-lg object-contain shadow-2xl'
				style={{ animation: 'lbZoomIn 0.2s ease-out' }}
				onClick={e => e.stopPropagation()}
			/>
		</div>,
		document.body,
	)
}
