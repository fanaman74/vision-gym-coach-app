'use client'

import { useRef } from 'react'
import { resizeImage } from '@/lib/resize-image'

interface Props {
  onCapture: (imageBase64: string, mimeType: string) => void
  isLoading: boolean
}

export default function CameraCapture({ onCapture, isLoading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const { base64, mimeType } = await resizeImage(file, 1280)
    onCapture(base64, mimeType)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        data-testid="camera-input"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="px-8 py-4 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 rounded-xl text-lg font-semibold disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Analysing…' : 'Capture Console'}
      </button>
    </div>
  )
}
