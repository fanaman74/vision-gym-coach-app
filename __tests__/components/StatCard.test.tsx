import { render, screen } from '@testing-library/react'
import StatCard from '@/components/StatCard'

describe('StatCard', () => {
  it('renders the value and label', () => {
    render(<StatCard label="Workouts" value="12" />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Workouts')).toBeInTheDocument()
  })

  it('renders a different label and value', () => {
    render(<StatCard label="Calories" value="3,240" />)
    expect(screen.getByText('3,240')).toBeInTheDocument()
    expect(screen.getByText('Calories')).toBeInTheDocument()
  })
})
