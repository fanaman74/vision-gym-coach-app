/**
 * @jest-environment node
 */
import { POST } from '@/app/api/parse-session/route'
import { NextRequest } from 'next/server'
import * as openrouterModule from '@/lib/openrouter'
import { RowingSession } from '@/types/metrics'

jest.mock('@/lib/openrouter')
const mockParse = openrouterModule.parseConsoleImage as jest.MockedFunction<
  typeof openrouterModule.parseConsoleImage
>

const mockSession: RowingSession = {
  consoleType: 'rowing',
  capturedAt: '2026-05-30T10:00:00.000Z',
  duration: '00:20:00',
  distanceMeters: 4000,
  splitPer500m: '2:30.0',
  strokeRate: 22,
  calories: 200,
  watts: 150,
}

describe('POST /api/parse-session', () => {
  beforeEach(() => mockParse.mockClear())

  it('returns 200 with parsed session on success', async () => {
    mockParse.mockResolvedValueOnce(mockSession)

    const req = new Request('http://localhost/api/parse-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'base64data', mimeType: 'image/jpeg' }),
    })

    const res = await POST(req as unknown as NextRequest)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.consoleType).toBe('rowing')
    expect(body.distanceMeters).toBe(4000)
  })

  it('returns 400 when image field is missing', async () => {
    const req = new Request('http://localhost/api/parse-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mimeType: 'image/jpeg' }),
    })

    const res = await POST(req as unknown as NextRequest)
    expect(res.status).toBe(400)
  })

  it('returns 400 when mimeType field is missing', async () => {
    const req = new Request('http://localhost/api/parse-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'data' }),
    })

    const res = await POST(req as unknown as NextRequest)
    expect(res.status).toBe(400)
  })

  it('returns 500 when OpenRouter throws', async () => {
    mockParse.mockRejectedValueOnce(new Error('OpenRouter error: 500'))

    const req = new Request('http://localhost/api/parse-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'data', mimeType: 'image/jpeg' }),
    })

    const res = await POST(req as unknown as NextRequest)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('AI service unavailable')
  })
})
