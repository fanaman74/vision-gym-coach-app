import { render, screen } from '@testing-library/react'
import SessionListItem from '@/components/SessionListItem'
import { StoredSession } from '@/lib/get-sessions'

const rowingStored: StoredSession = {
  id: 'test-123',
  created_at: new Date().toISOString(),
  console_type: 'rowing',
  session_data: {
    consoleType: 'rowing',
    capturedAt: new Date().toISOString(),
    duration: '00:22:15',
    distanceMeters: 5000,
    splitPer500m: '2:13.5',
    strokeRate: 24,
    calories: 285,
    watts: 178,
  },
}

const cyclingStored: StoredSession = {
  id: 'test-456',
  created_at: new Date().toISOString(),
  console_type: 'cycling',
  session_data: {
    consoleType: 'cycling',
    capturedAt: new Date().toISOString(),
    duration: '00:45:00',
    distanceKm: 18.4,
    avgWatts: 165,
    avgRpm: 85,
    avgSpeedKmh: 24.5,
    calories: 410,
  },
}

describe('SessionListItem', () => {
  it('renders rowing session with type label, distance and calories', () => {
    render(<SessionListItem session={rowingStored} />)
    expect(screen.getByText('Rowing')).toBeInTheDocument()
    expect(screen.getByText(/5,000 m/)).toBeInTheDocument()
    expect(screen.getByText(/285 kcal/)).toBeInTheDocument()
  })

  it('renders cycling session with distance in km', () => {
    render(<SessionListItem session={cyclingStored} />)
    expect(screen.getByText('Cycling')).toBeInTheDocument()
    expect(screen.getByText(/18\.4 km/)).toBeInTheDocument()
    expect(screen.getByText(/410 kcal/)).toBeInTheDocument()
  })

  it('shows "Today" for sessions created now', () => {
    render(<SessionListItem session={rowingStored} />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })
})
