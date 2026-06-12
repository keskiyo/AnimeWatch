import type { AdminAuditLog } from '@/types/admin'

type AdminAuditPanelProps = {
	logs: AdminAuditLog[]
	isLoading: boolean
	isError: boolean
}

const ACTION_LABELS: Record<string, string> = {
	'user.password_reset': 'Смена пароля',
}

export function AdminAuditPanel({
	logs,
	isLoading,
	isError,
}: AdminAuditPanelProps) {
	return (
		<section className='mt-7'>
			<div className='mb-4'>
				<h2 className='m-0 text-2xl font-normal text-aw-text'>
					Журнал администратора
				</h2>
				<p className='m-0 mt-1 text-sm text-aw-subtle'>
					Последние действия в панели управления.
				</p>
			</div>
			{isError && (
				<p className='rounded-md bg-aw-muted px-4 py-3 text-sm text-aw-accent'>
					Не удалось загрузить журнал действий
				</p>
			)}
			<div className='overflow-hidden rounded-md border border-aw-border'>
				<table className='w-full border-collapse text-left text-sm'>
					<thead className='bg-aw-elevated text-aw-subtle'>
						<tr>
							<th className='px-4 py-3 font-medium'>Дата</th>
							<th className='px-4 py-3 font-medium'>Администратор</th>
							<th className='px-4 py-3 font-medium'>Действие</th>
							<th className='px-4 py-3 font-medium'>Цель</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-aw-border bg-aw-surface'>
						{isLoading && logs.length === 0 ? (
							<AuditRowsSkeleton />
						) : logs.length > 0 ? (
							logs.map(log => <AuditRow key={log.id} log={log} />)
						) : (
							<tr>
								<td colSpan={4} className='px-4 py-8 text-center text-aw-subtle'>
									Журнал пока пуст
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</section>
	)
}

function AuditRow({ log }: { log: AdminAuditLog }) {
	return (
		<tr className='text-aw-text'>
			<td className='px-4 py-3 text-aw-subtle'>
				{new Date(log.created_at).toLocaleString('ru-RU')}
			</td>
			<td className='px-4 py-3'>{log.admin_name || `ID ${log.admin_user_id}`}</td>
			<td className='px-4 py-3 text-aw-accent'>
				{ACTION_LABELS[log.action] || log.action}
			</td>
			<td className='px-4 py-3 text-aw-subtle'>
				{log.target_type} #{log.target_id}
			</td>
		</tr>
	)
}

function AuditRowsSkeleton() {
	return Array.from({ length: 3 }).map((_, index) => (
		<tr key={index}>
			<td colSpan={4} className='px-4 py-3'>
				<div className='h-8 animate-pulse rounded bg-aw-elevated' />
			</td>
		</tr>
	))
}
