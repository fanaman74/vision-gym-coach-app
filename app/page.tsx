'use client'

import { useState } from 'react'
import Image from 'next/image'
import CameraCapture from '@/components/CameraCapture'
import MetricsCard from '@/components/MetricsCard'
import { GymSession } from '@/types/metrics'
import { saveSession } from '@/lib/save-session'

export default function Home() {
  const [session, setSession] = useState<GymSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCapture(imageBase64: string, mimeType: string) {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/parse-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, mimeType }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'AI service unavailable')
      }
      const data: GymSession = await res.json()
      setSession(data)
      saveSession(data) // fire-and-forget, silent on error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white pb-20">
      {/* Hero */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1280&q=80"
          alt="Gym workout"
          fill
          priority
          className="object-cover"
        />
        {/* Gradient overlay blending into page background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-[#0a0a0a]" />
        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-4 gap-4">
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight uppercase">Gym Coach</h1>
            <p className="text-gray-300 text-sm mt-1">Capture your workout metrics</p>
          </div>
          <CameraCapture onCapture={handleCapture} isLoading={isLoading} />
        </div>
      </div>

      {/* Results area */}
      <div className="px-4 pt-4 flex flex-col items-center gap-4">
        {error && (
          <p className="text-red-400 text-sm text-center max-w-sm">{error}</p>
        )}
        {session && <MetricsCard session={session} />}
      </div>
    </main>
  )
}
