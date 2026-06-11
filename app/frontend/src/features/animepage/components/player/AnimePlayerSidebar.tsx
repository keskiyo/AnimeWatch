import type { AnimePlayerSidebarProps } from '@/types/animePage'
import { useState } from 'react'

type SidebarTab = 'dubbing' | 'player'

const TAB_BUTTON =
	'cursor-pointer pb-2 text-sm font-medium transition-colors border-b-2'
const ITEM_BUTTON =
	'w-full cursor-pointer rounded px-3 py-2 text-left text-sm transition-colors'
const ITEM_ACTIVE = 'bg-[#4f5052] text-aw-accent'
const ITEM_IDLE = 'text-aw-subtle hover:bg-aw-surface hover:text-aw-text'

// ~13 items (36px row + 4px gap) before the list starts scrolling instead
// of stretching the page down and breaking the layout
const TRACK_LIST_SCROLL =
	'max-h-[516px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--color-aw-border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-aw-border [&::-webkit-scrollbar-track]:bg-transparent'

/** Right column of the player: "Озвучка" / "Плеер" tabs. */
export function AnimePlayerSidebar({
	tracks,
	providers,
	hasEpisodes,
	activeTrackId,
	activeProviderId,
	onTrackChange,
	onProviderChange,
}: AnimePlayerSidebarProps) {
	const [tab, setTab] = useState<SidebarTab>('dubbing')

	return (
		<div>
			<div className='flex border-b border-aw-border'>
				<button
					type='button'
					onClick={() => setTab('dubbing')}
					className={`${TAB_BUTTON} px-0 pr-4 ${
						tab === 'dubbing'
							? 'border-aw-accent text-aw-text'
							: 'border-transparent text-aw-subtle hover:text-aw-text'
					}`}
				>
					Озвучка
				</button>
				<button
					type='button'
					onClick={() => setTab('player')}
					className={`${TAB_BUTTON} px-4 ${
						tab === 'player'
							? 'border-aw-accent text-aw-text'
							: 'border-transparent text-aw-subtle hover:text-aw-text'
					}`}
				>
					Плеер
				</button>
			</div>

			<div className='mt-3'>
				{tab === 'dubbing' && (
					<div className={`flex flex-col gap-1 ${TRACK_LIST_SCROLL}`}>
						{tracks.length === 0 ? (
							<EmptyNote
								text={
									hasEpisodes
										? 'Озвучки недоступны'
										: 'Озвучки появятся после выхода серий'
								}
							/>
						) : (
							tracks.map(track => (
								<button
									key={track.id}
									type='button'
									onClick={() => onTrackChange?.(track.id)}
									className={`${ITEM_BUTTON} ${
										activeTrackId === track.id
											? ITEM_ACTIVE
											: ITEM_IDLE
									}`}
								>
									{track.label}
								</button>
							))
						)}
					</div>
				)}

				{tab === 'player' && (
					<div className='flex flex-col gap-1'>
						{providers.length === 0 ? (
							<EmptyNote
								text={
									hasEpisodes
										? 'Плееры недоступны'
										: 'Плеер появится после выхода серий'
								}
							/>
						) : (
							providers.map(provider => (
								<button
									key={provider.id}
									type='button'
									onClick={() =>
										onProviderChange?.(provider.id)
									}
									className={`${ITEM_BUTTON} ${
										(activeProviderId ??
											providers[0]?.id) === provider.id
											? ITEM_ACTIVE
											: ITEM_IDLE
									}`}
								>
									{provider.label}
								</button>
							))
						)}
					</div>
				)}
			</div>
		</div>
	)
}

function EmptyNote({ text }: { text: string }) {
	return (
		<div className='rounded-md bg-aw-elevated px-3 py-2 text-sm text-aw-subtle'>
			{text}
		</div>
	)
}
