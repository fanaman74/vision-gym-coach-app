import { render, screen } from '@testing-library/react'
import BottomNav from '@/components/BottomNav'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('BottomNav', () => {
  it('renders Home and History tab links', () => {
    render(<BottomNav />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('applies orange accent class to the active Home tab', () => {
    render(<BottomNav />)
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveClass('text-orange-500')
  })

  it('applies muted class to the inactive History tab', () => {
    render(<BottomNav />)
    const historyLink = screen.getByText('History').closest('a')
    expect(historyLink).toHaveClass('text-gray-500')
  })
})
