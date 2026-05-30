'use client'

import { useRef } from 'react'
import { resizeImage } from '@/lib/resize-image'

interface Props {
  onCapture: (imageBase64: string, mimeType: string) => void
  isLoading: boolean
}

export default function CameraCapture({ onCapture, isLoading }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const { base64, mimeType } = await resizeImage(file, 1280)
    onCapture(base64, mimeType)
    // Reset both inputs so the same file can be re-selected
    if (cameraRef.current) cameraRef.current.value = ''
    if (uploadRef.current) uploadRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Hidden: camera (rear lens, direct) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        data-testid="camera-input"
      />
      {/* Hidden: gallery / file upload (no capture, shows picker) */}
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="upload-input"
      />

      {isLoading ? (
        <button
          disabled
          className="w-56 px-6 py-4 bg-orange-500 rounded-xl text-lg font-semibold opacity-50"
        >
          Analysing…
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center gap-1 px-6 py-3 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 rounded-xl font-semibold transition-colors"
          >
            <span className="text-2xl">📷</span>
            <span className="text-xs">Take Photo</span>
          </button>
          <button
            onClick={() => uploadRef.current?.click()}
            className="flex flex-col items-center gap-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-xl font-semibold transition-colors"
          >
            <span className="text-2xl">🖼️</span>
            <span className="text-xs">Upload Image</span>
          </button>
        </div>
      )}
    </div>
  )
}
