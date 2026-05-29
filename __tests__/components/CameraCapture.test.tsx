import { render, screen } from '@testing-library/react'
import CameraCapture from '@/components/CameraCapture'

describe('CameraCapture', () => {
  it('renders a Capture Console button', () => {
    render(<CameraCapture onCapture={jest.fn()} isLoading={false} />)
    expect(screen.getByRole('button', { name: /capture console/i })).toBeInTheDocument()
  })

  it('disables button and shows loading text when isLoading is true', () => {
    render(<CameraCapture onCapture={jest.fn()} isLoading={true} />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent(/analysing/i)
  })

  it('renders a hidden file input with camera capture attributes', () => {
    render(<CameraCapture onCapture={jest.fn()} isLoading={false} />)
    const input = screen.getByTestId('camera-input') as HTMLInputElement
    expect(input.type).toBe('file')
    expect(input.accept).toBe('image/*')
    expect(input.getAttribute('capture')).toBe('environment')
  })
})
