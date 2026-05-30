import { GymSession, RowingSession, CyclingSession } from '@/types/metrics'

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <p className="text-xs text-orange-400 mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function RowingMetrics({ session }: { session: RowingSession }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {session.duration && <Metric label="Duration" value={session.duration} />}
      {session.distanceMeters && <Metric label="Distance" value={`${session.distanceMeters} m`} />}
      {session.splitPer500m && <Metric label="Split" value={`${session.splitPer500m} /500m`} />}
      {session.strokeRate && <Metric label="Stroke Rate" value={`${session.strokeRate} spm`} />}
      {session.watts && <Metric label="Power" value={`${session.watts} W`} />}
      {session.calories && <Metric label="Calories" value={`${session.calories} kcal`} />}
      {session.heartRate && <Metric label="Heart Rate" value={`${session.heartRate} bpm`} />}
    </div>
  )
}

function CyclingMetrics({ session }: { session: CyclingSession }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {session.duration && <Metric label="Duration" value={session.duration} />}
      {session.distanceKm && <Metric label="Distance" value={`${session.distanceKm} km`} />}
      {session.avgWatts && <Metric label="Avg Power" value={`${session.avgWatts} W`} />}
      {session.avgRpm && <Metric label="RPM" value={`${session.avgRpm}`} />}
      {session.avgSpeedKmh && <Metric label="Avg Speed" value={`${session.avgSpeedKmh} km/h`} />}
      {session.calories && <Metric label="Calories" value={`${session.calories} kcal`} />}
      {session.heartRate && <Metric label="Heart Rate" value={`${session.heartRate} bpm`} />}
    </div>
  )
}

export default function MetricsCard({ session }: { session: GymSession }) {
  if (session.consoleType === 'unknown') {
    return (
      <div className="w-full max-w-sm bg-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-400">Couldn't read console — try again in better light</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm bg-gray-900 rounded-xl p-4">
      <h2 className="text-lg font-bold mb-4 capitalize">
        {session.consoleType === 'rowing' ? 'Rowing' : 'Cycling'}
      </h2>
      {session.consoleType === 'rowing'
        ? <RowingMetrics session={session} />
        : <CyclingMetrics session={session} />}
    </div>
  )
}
