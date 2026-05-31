import { NextRequest, NextResponse } from 'next/server'
import { parseConsoleImage } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  let body: { image?: string; mimeType?: string } | null = null

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body?.image || !body?.mimeType) {
    return NextResponse.json({ error: 'Missing image or mimeType' }, { status: 400 })
  }

  try {
    const session = await parseConsoleImage(body.image, body.mimeType)
    return NextResponse.json(session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[parse-session]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
