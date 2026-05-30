import { getSessions, StoredSession } from '@/lib/get-sessions'
import StatCard from '@/components/StatCard'
import SessionListItem from '@/components/SessionListItem'

function computeTotals(sessions: StoredSession[]) {
  let totalDistance = 0
  let totalCalories = 0

  for (const s of sessions) {
    const data = s.session_data
    if (data.consoleType === 'rowing' && 'distanceMeters' in data && data.distanceMeters) {
      totalDistance += (data as { distanceMeters: number }).distanceMeters / 1000
    }
    if (data.consoleType === 'cycling' && 'distanceKm' in data && data.distanceKm) {
      totalDistance += (data as { distanceKm: number }).distanceKm
    }
    if ('calories' in data && (data as { calories?: number }).calories) {
      totalCalories += (data as { calories: number }).calories
    }
  }

  return {
    workouts: sessions.length,
    distance: totalDistance.toFixed(1),
    calories: totalCalories.toLocaleString(),
  }
}

export default async function HistoryPage() {
  let sessions: StoredSession[] = []
  let fetchError = false

  try {
    sessions = await getSessions()
  } catch {
    fetchError = true
  }

  const totals = computeTotals(sessions)

  return (
    <main className="min-h-screen bg-gray-950 text-white pb-20">
      <div className="px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold">Your Performance</h1>
      </div>

      <div className="px-4 flex gap-3 mb-6">
        <StatCard label="Workouts" value={String(totals.workouts)} />
        <StatCard label="Distance (km)" value={totals.distance} />
        <StatCard label="Calories" value={totals.calories} />
      </div>

      <div className="px-4">
        {fetchError && (
          <p className="text-red-400 text-sm text-center py-8">
            Couldn&apos;t load history — try again
          </p>
        )}

        {!fetchError && sessions.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="text-4xl">🏋️</span>
            <p className="text-gray-400 text-center">
              No sessions yet — capture your first workout!
            </p>
          </div>
        )}

        {!fetchError && sessions.length > 0 && (
          <div>
            {sessions.map((session) => (
              <SessionListItem key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
