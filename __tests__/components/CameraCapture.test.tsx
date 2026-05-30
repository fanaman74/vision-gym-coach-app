import { render, screen } from '@testing-library/react'
import CameraCapture from '@/components/CameraCapture'

describe('CameraCapture', () => {
  it('renders Take Photo and Upload Image buttons', () => {
    render(<CameraCapture onCapture={jest.fn()} isLoading={false} />)
    expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload image/i })).toBeInTheDocument()
  })

  it('shows a single disabled Analysing button when isLoading is true', () => {
    render(<CameraCapture onCapture={jest.fn()} isLoading={true} />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent(/analysing/i)
  })

  it('renders camera input with capture="environment"', () => {
    render(<CameraCapture onCapture={jest.fn()} isLoading={false} />)
    const input = screen.getByTestId('camera-input') as HTMLInputElement
    expect(input.type).toBe('file')
    expect(input.accept).toBe('image/*')
    expect(input.getAttribute('capture')).toBe('environment')
  })

  it('renders upload input without capture attribute', () => {
    render(<CameraCapture onCapture={jest.fn()} isLoading={false} />)
    const input = screen.getByTestId('upload-input') as HTMLInputElement
    expect(input.type).toBe('file')
    expect(input.accept).toBe('image/*')
    expect(input.getAttribute('capture')).toBeNull()
  })
})
