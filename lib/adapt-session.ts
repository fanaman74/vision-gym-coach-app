import { StoredSession } from './get-sessions'
import { RowingSession, CyclingSession } from '@/types/metrics'

export interface SplitSession {
  id: string
  sport: 'rowing' | 'cycling'
  duration: number   // seconds
  distance: number   // metres
  date: string       // ISO
  source: 'camera' | 'upload'
  calories?: number
  watts?: number
}

/** Parse "HH:MM:SS" or "MM:SS" → seconds */
export function parseDuration(s?: string): number {
  if (!s) return 0
  const parts = s.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] ?? 0
}

/** Format seconds → "HH:MM:SS" or "MM:SS" */
export function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** Format pace as /500m (rowing) or /km (cycling) */
export function formatPace(durationSecs: number, distanceM: number): string {
  if (!distanceM) return '—'
  const pacePerUnit = (durationSecs / distanceM) * 500
  const m = Math.floor(pacePerUnit / 60)
  const s = Math.round(pacePerUnit % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** "3 hours ago", "yesterday", etc. */
export function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** YYYY-MM-DD */
export function ymd(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toISOString().slice(0, 10)
}

export function storedToSplit(s: StoredSession): SplitSession {
  const data = s.session_data
  const sport = data.consoleType === 'cycling' ? 'cycling' : 'rowing'
  const duration = parseDuration((data as { duration?: string }).duration)
  const distance = sport === 'rowing'
    ? ((data as RowingSession).distanceMeters ?? 0)
    : ((data as CyclingSession).distanceKm ?? 0) * 1000
  const calories = (data as { calories?: number }).calories
  const watts = sport === 'rowing'
    ? (data as RowingSession).watts
    : (data as CyclingSession).avgWatts

  return {
    id: s.id,
    sport,
    duration,
    distance,
    date: s.created_at,
    source: 'upload',
    calories,
    watts,
  }
}

/** Convert a fresh GymSession (from API) to SplitSession */
export function gymSessionToSplit(
  id: string,
  data: import('@/types/metrics').GymSession,
  capturedAt: string
): SplitSession {
  const sport = data.consoleType === 'cycling' ? 'cycling' : 'rowing'
  const duration = parseDuration((data as { duration?: string }).duration)
  const distance = sport === 'rowing'
    ? ((data as RowingSession).distanceMeters ?? 0)
    : ((data as CyclingSession).distanceKm ?? 0) * 1000

  return {
    id,
    sport,
    duration,
    distance,
    date: capturedAt,
    source: 'camera',
    calories: (data as { calories?: number }).calories,
    watts: sport === 'rowing' ? (data as RowingSession).watts : (data as CyclingSession).avgWatts,
  }
}
