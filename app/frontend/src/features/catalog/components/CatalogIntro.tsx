type CatalogIntroProps = {
	isIntroExpanded: boolean
	onToggleIntro: () => void
	paragraphs: readonly string[]
}

export function CatalogIntro({
	isIntroExpanded,
	onToggleIntro,
	paragraphs,
}: CatalogIntroProps) {
	return (
		<div>
			<h1 className='mb-4 mt-1.75 text-[clamp(34px,4vw,38px)] font-normal leading-tight text-aw-text'>
				Список аниме
			</h1>
			{paragraphs.map(paragraph => (
				<p
					key={paragraph}
					className='mb-1.5 max-w-245 text-[15px] leading-[1.55] text-[#f1f4f7]'
				>
					{paragraph}
				</p>
			))}
			<button
				type='button'
				className='mt-1 inline-flex cursor-pointer border-0 bg-transparent p-0 text-sm text-aw-accent hover:underline'
				aria-expanded={isIntroExpanded}
				onClick={onToggleIntro}
			>
				{isIntroExpanded ? 'Свернуть' : 'Развернуть'}
			</button>
		</div>
	)
}
