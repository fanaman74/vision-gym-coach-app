import { render, screen } from '@testing-library/react'
import MetricsCard from '@/components/MetricsCard'
import { RowingSession, CyclingSession, GymSession } from '@/types/metrics'

const rowingSession: RowingSession = {
  consoleType: 'rowing',
  capturedAt: '2026-05-30T10:00:00Z',
  duration: '00:22:15',
  distanceMeters: 5000,
  splitPer500m: '2:13.5',
  strokeRate: 24,
  calories: 285,
  watts: 178,
}

const cyclingSession: CyclingSession = {
  consoleType: 'cycling',
  capturedAt: '2026-05-30T10:00:00Z',
  duration: '00:45:00',
  distanceKm: 18.4,
  avgWatts: 165,
  avgRpm: 85,
  avgSpeedKmh: 24.5,
  calories: 410,
}

const unknownSession: GymSession = {
  consoleType: 'unknown',
  capturedAt: '2026-05-30T10:00:00Z',
}

describe('MetricsCard', () => {
  it('renders rowing session with key metrics', () => {
    render(<MetricsCard session={rowingSession} />)
    expect(screen.getByText('Rowing')).toBeInTheDocument()
    expect(screen.getByText('5000 m')).toBeInTheDocument()
    expect(screen.getByText('2:13.5 /500m')).toBeInTheDocument()
    expect(screen.getByText('285 kcal')).toBeInTheDocument()
    expect(screen.getByText('178 W')).toBeInTheDocument()
  })

  it('renders cycling session with key metrics', () => {
    render(<MetricsCard session={cyclingSession} />)
    expect(screen.getByText('Cycling')).toBeInTheDocument()
    expect(screen.getByText('18.4 km')).toBeInTheDocument()
    expect(screen.getByText('410 kcal')).toBeInTheDocument()
    expect(screen.getByText('165 W')).toBeInTheDocument()
  })

  it('renders unknown console message when consoleType is unknown', () => {
    render(<MetricsCard session={unknownSession} />)
    expect(screen.getByText(/couldn't read console/i)).toBeInTheDocument()
  })

  it('does not render heartRate tile when heartRate is absent', () => {
    render(<MetricsCard session={rowingSession} />)
    expect(screen.queryByText(/bpm/i)).not.toBeInTheDocument()
  })
})
