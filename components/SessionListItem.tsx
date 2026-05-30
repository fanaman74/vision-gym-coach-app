import { StoredSession } from '@/lib/get-sessions'

interface Props {
  session: StoredSession
}

function formatRelativeDate(dateStr: string): string {
  const diffDays = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

function getHeadlineMetric(session: StoredSession): string {
  const data = session.session_data
  if (data.consoleType === 'rowing' && 'distanceMeters' in data && data.distanceMeters) {
    return `${data.distanceMeters.toLocaleString()} m`
  }
  if (data.consoleType === 'cycling' && 'distanceKm' in data && data.distanceKm) {
    return `${data.distanceKm} km`
  }
  return '—'
}

export default function SessionListItem({ session }: Props) {
  const data = session.session_data
  const icon = data.consoleType === 'rowing' ? '🚣' : data.consoleType === 'cycling' ? '🚴' : '🏋️'
  const typeLabel =
    data.consoleType === 'rowing' ? 'Rowing' : data.consoleType === 'cycling' ? 'Cycling' : 'Unknown'
  const calories = 'calories' in data && data.calories ? `${data.calories} kcal` : null
  const duration = 'duration' in data && (data as { duration?: string }).duration
    ? (data as { duration: string }).duration
    : null

  return (
    <div className="flex items-start gap-3 py-4 border-b border-gray-800 last:border-0">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">{typeLabel}</p>
          <p className="text-xs text-gray-500">{formatRelativeDate(session.created_at)}</p>
        </div>
        <p className="text-sm text-gray-400 mt-0.5">
          {[getHeadlineMetric(session), calories, duration].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  )
}
