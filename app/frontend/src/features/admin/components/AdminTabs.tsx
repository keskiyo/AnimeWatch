export type AdminTab = 'users' | 'pages' | 'audit' | 'comments'

const TABS: Array<{ id: AdminTab; label: string }> = [
	{ id: 'users', label: 'Пользователи' },
	{ id: 'pages', label: 'Страницы' },
	{ id: 'audit', label: 'Журнал' },
	{ id: 'comments', label: 'Комментарии' },
]

type AdminTabsProps = {
	activeTab: AdminTab
	onChange: (tab: AdminTab) => void
}

export function AdminTabs({ activeTab, onChange }: AdminTabsProps) {
	return (
		<div className='mt-7 flex gap-2 overflow-x-auto border-b border-aw-border pb-3'>
			{TABS.map(tab => (
				<button
					key={tab.id}
					type='button'
					onClick={() => onChange(tab.id)}
					className={`h-10 shrink-0 cursor-pointer rounded-md px-4 text-sm ${
						activeTab === tab.id
							? 'bg-aw-accent text-white'
							: 'border border-aw-border bg-transparent text-aw-text hover:border-aw-accent'
					}`}
				>
					{tab.label}
				</button>
			))}
		</div>
	)
}
