'use client'

import { useState } from 'react'
import CameraCapture from '@/components/CameraCapture'
import MetricsCard from '@/components/MetricsCard'
import { GymSession } from '@/types/metrics'

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-4 gap-6">
      <header className="w-full max-w-sm mt-8">
        <h1 className="text-2xl font-bold">Gym Coach</h1>
        <p className="text-gray-400 text-sm mt-1">Photograph your console to capture metrics</p>
      </header>

      <CameraCapture onCapture={handleCapture} isLoading={isLoading} />

      {error && (
        <p className="text-red-400 text-sm text-center max-w-sm">{error}</p>
      )}

      {session && <MetricsCard session={session} />}
    </main>
  )
}
