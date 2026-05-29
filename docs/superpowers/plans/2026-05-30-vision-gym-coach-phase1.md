# Vision Gym Coach — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA where a user photographs a gym console (rowing/cycling) and the app extracts structured performance metrics using a vision AI model.

**Architecture:** Next.js App Router with a `/api/parse-session` route that receives a base64 image from the client, calls OpenRouter with a structured vision prompt, and returns typed JSON metrics. No persistence in Phase 1 — Supabase client is initialized but unused. All state lives in React component state.

**Tech Stack:** Next.js 14+ (App Router, TypeScript, Tailwind), OpenRouter API, Supabase JS client (stub), Jest + React Testing Library

---

## File Map

| File | Responsibility |
|---|---|
| `types/metrics.ts` | Shared TypeScript types for `GymSession`, `RowingSession`, `CyclingSession` |
| `lib/prompts.ts` | Builds the vision prompt string sent to the AI model |
| `lib/openrouter.ts` | OpenRouter API client — sends image + prompt, returns `GymSession` |
| `lib/resize-image.ts` | Client-side Canvas resize — converts `File` to base64 under 1280px |
| `lib/supabase.ts` | Supabase client instance (initialized, no writes in Phase 1) |
| `app/api/parse-session/route.ts` | POST handler: validates body, calls `openrouter.ts`, returns JSON |
| `components/MetricsCard.tsx` | Renders a `GymSession` as a metric grid card |
| `components/CameraCapture.tsx` | File input trigger + calls `resizeImage`, calls `onCapture` prop |
| `app/page.tsx` | Home page: composes `CameraCapture` + `MetricsCard`, manages state |
| `app/layout.tsx` | PWA shell — viewport meta, manifest link, theme |
| `public/manifest.json` | PWA manifest |
| `jest.config.ts` | Jest config using `next/jest` factory |
| `jest.setup.ts` | Imports `@testing-library/jest-dom` |

---

## Task 1: Scaffold Next.js project

**Files:**
- Creates: entire project scaffold in `/Users/fred/Documents/VibeCoding/claudecode/mygymapp/`

- [ ] **Step 1: Scaffold the project**

```bash
cd /Users/fred/Documents/VibeCoding/claudecode/mygymapp
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --no-git
```

Accept all defaults when prompted. This creates `app/`, `public/`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `package.json`.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest
```

- [ ] **Step 3: Create `.env.local`**

```
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=google/gemini-2.0-flash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] **Step 4: Init git**

```bash
git init
echo ".env.local" >> .gitignore
git add .
git commit -m "chore: scaffold Next.js project"
```

---

## Task 2: Configure Jest

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json` (add test scripts)

- [ ] **Step 1: Write `jest.config.ts`**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
```

- [ ] **Step 2: Write `jest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Add test scripts to `package.json`**

In `package.json`, add to the `"scripts"` object:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 4: Verify Jest runs**

```bash
npm test -- --passWithNoTests
```

Expected output: `Test Suites: 0 skipped`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add jest.config.ts jest.setup.ts package.json
git commit -m "chore: configure Jest with next/jest and testing-library"
```

---

## Task 3: Define TypeScript types

**Files:**
- Create: `types/metrics.ts`

- [ ] **Step 1: Create `types/metrics.ts`**

```typescript
export type ConsoleType = 'rowing' | 'cycling' | 'unknown'

export interface BaseSession {
  consoleType: ConsoleType
  capturedAt: string
  imageDataUrl?: string
}

export interface RowingSession extends BaseSession {
  consoleType: 'rowing'
  duration: string
  distanceMeters: number
  splitPer500m: string
  strokeRate: number
  calories: number
  watts: number
  heartRate?: number
}

export interface CyclingSession extends BaseSession {
  consoleType: 'cycling'
  duration: string
  distanceKm: number
  avgWatts: number
  avgRpm: number
  avgSpeedKmh: number
  calories: number
  heartRate?: number
  resistanceLevel?: number
}

export type GymSession = RowingSession | CyclingSession | (BaseSession & { consoleType: 'unknown' })
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add types/metrics.ts
git commit -m "feat: add GymSession TypeScript types"
```

---

## Task 4: Write vision prompt (TDD)

**Files:**
- Create: `lib/prompts.ts`
- Create: `__tests__/lib/prompts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/prompts.test.ts`:

```typescript
import { buildVisionPrompt } from '@/lib/prompts'

describe('buildVisionPrompt', () => {
  it('returns a non-empty string', () => {
    expect(buildVisionPrompt().length).toBeGreaterThan(100)
  })

  it('instructs the model to return only JSON', () => {
    const prompt = buildVisionPrompt()
    expect(prompt).toMatch(/only.*json|json.*only/i)
  })

  it('includes all three console types', () => {
    const prompt = buildVisionPrompt()
    expect(prompt).toContain('rowing')
    expect(prompt).toContain('cycling')
    expect(prompt).toContain('unknown')
  })

  it('instructs the model to omit unreadable fields rather than guess', () => {
    const prompt = buildVisionPrompt()
    expect(prompt).toMatch(/omit|never guess/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/lib/prompts.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/prompts'`

- [ ] **Step 3: Implement `lib/prompts.ts`**

```typescript
export function buildVisionPrompt(): string {
  return `You are a gym console OCR assistant. Analyze this image of a gym console screen.

Return ONLY a valid JSON object. No markdown, no code fences, no prose.

Rules:
1. Set "consoleType" to "rowing", "cycling", or "unknown"
2. Extract all visible metrics exactly as shown on screen
3. Omit any field you cannot clearly read — never guess or infer values
4. If this is not a recognized gym console: return {"consoleType":"unknown"}

Rowing console fields (include only if clearly visible):
  duration (string "HH:MM:SS"), distanceMeters (number), splitPer500m (string "M:SS.s"),
  strokeRate (number, strokes per minute), calories (number), watts (number), heartRate (number)

Cycling console fields (include only if clearly visible):
  duration (string "HH:MM:SS"), distanceKm (number), avgWatts (number),
  avgRpm (number), avgSpeedKmh (number), calories (number), heartRate (number), resistanceLevel (number)

Example rowing: {"consoleType":"rowing","duration":"00:22:15","distanceMeters":5000,"splitPer500m":"2:13.5","strokeRate":24,"calories":285,"watts":178}
Example cycling: {"consoleType":"cycling","duration":"00:45:00","distanceKm":18.4,"avgWatts":165,"avgRpm":85,"avgSpeedKmh":24.5,"calories":410}`
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/lib/prompts.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/prompts.ts __tests__/lib/prompts.test.ts
git commit -m "feat: add vision prompt builder"
```

---

## Task 5: Write OpenRouter client (TDD)

**Files:**
- Create: `lib/openrouter.ts`
- Create: `__tests__/lib/openrouter.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/openrouter.test.ts`:

```typescript
import { parseConsoleImage } from '@/lib/openrouter'

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockRowingSession = {
  consoleType: 'rowing',
  duration: '00:22:15',
  distanceMeters: 5000,
  splitPer500m: '2:13.5',
  strokeRate: 24,
  calories: 285,
  watts: 178,
}

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'test-key'
  process.env.OPENROUTER_MODEL = 'google/gemini-2.0-flash'
  mockFetch.mockClear()
})

describe('parseConsoleImage', () => {
  it('calls OpenRouter with Authorization header and returns parsed session', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockRowingSession) } }],
      }),
    })

    const result = await parseConsoleImage('base64data', 'image/jpeg')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      })
    )
    expect(result.consoleType).toBe('rowing')
    expect(result.capturedAt).toBeDefined()
    expect(new Date(result.capturedAt).toISOString()).toBe(result.capturedAt)
  })

  it('handles model response wrapped in markdown code fences', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '```json\n' + JSON.stringify(mockRowingSession) + '\n```' } }],
      }),
    })

    const result = await parseConsoleImage('data', 'image/jpeg')
    expect(result.consoleType).toBe('rowing')
  })

  it('throws an error when OpenRouter returns a non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 })

    await expect(parseConsoleImage('data', 'image/jpeg')).rejects.toThrow(
      'OpenRouter error: 429'
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/lib/openrouter.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/openrouter'`

- [ ] **Step 3: Implement `lib/openrouter.ts`**

```typescript
import { GymSession } from '@/types/metrics'
import { buildVisionPrompt } from './prompts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

function extractJson(content: string): string {
  const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  return match ? match[1] : content.trim()
}

export async function parseConsoleImage(
  imageBase64: string,
  mimeType: string
): Promise<GymSession> {
  const model = process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash'

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://gymcoach.app',
      'X-Title': 'Vision Gym Coach',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: buildVisionPrompt() },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  const json = JSON.parse(extractJson(content))

  return { ...json, capturedAt: new Date().toISOString() }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/lib/openrouter.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/openrouter.ts __tests__/lib/openrouter.test.ts
git commit -m "feat: add OpenRouter client with markdown fence handling"
```

---

## Task 6: Write API route (TDD)

**Files:**
- Create: `app/api/parse-session/route.ts`
- Create: `__tests__/api/parse-session.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/parse-session.test.ts`:

```typescript
import { POST } from '@/app/api/parse-session/route'
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

    const res = await POST(req)
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

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when mimeType field is missing', async () => {
    const req = new Request('http://localhost/api/parse-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'data' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 when OpenRouter throws', async () => {
    mockParse.mockRejectedValueOnce(new Error('OpenRouter error: 500'))

    const req = new Request('http://localhost/api/parse-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'data', mimeType: 'image/jpeg' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('AI service unavailable')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/api/parse-session.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/parse-session/route'`

- [ ] **Step 3: Implement `app/api/parse-session/route.ts`**

```typescript
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
    console.error('[parse-session]', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/api/parse-session.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/parse-session/route.ts __tests__/api/parse-session.test.ts
git commit -m "feat: add parse-session API route"
```

---

## Task 7: Write image resize utility

**Files:**
- Create: `lib/resize-image.ts`
- Create: `__tests__/lib/resize-image.test.ts`

- [ ] **Step 1: Write a smoke test**

Create `__tests__/lib/resize-image.test.ts`:

```typescript
describe('resizeImage module', () => {
  it('exports a resizeImage function', async () => {
    const mod = await import('@/lib/resize-image')
    expect(typeof mod.resizeImage).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/lib/resize-image.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/resize-image'`

- [ ] **Step 3: Implement `lib/resize-image.ts`**

```typescript
export async function resizeImage(
  file: File,
  maxWidth: number
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/lib/resize-image.test.ts
```

Expected: 1 test PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/resize-image.ts __tests__/lib/resize-image.test.ts
git commit -m "feat: add client-side image resize utility"
```

---

## Task 8: Set up Supabase client stub

**Files:**
- Create: `lib/supabase.ts`

- [ ] **Step 1: Create `lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase.ts
git commit -m "chore: initialize Supabase client (Phase 2 placeholder)"
```

---

## Task 9: Build MetricsCard component (TDD)

**Files:**
- Create: `components/MetricsCard.tsx`
- Create: `__tests__/components/MetricsCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/MetricsCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import MetricsCard from '@/components/MetricsCard'
import { RowingSession, CyclingSession, GymSession } from '@/types/metrics'

const rowingSession: RowingSession = {
  consoleType: 'rowing',
  capturedAt: '2026-05-30T10:00:00Z',
  duration: '00:22:15',
  distanceMeters: 5000,
  splitPer500m: '2:13.5',
  strokeRate: 24,
  calories: 285,
  watts: 178,
}

const cyclingSession: CyclingSession = {
  consoleType: 'cycling',
  capturedAt: '2026-05-30T10:00:00Z',
  duration: '00:45:00',
  distanceKm: 18.4,
  avgWatts: 165,
  avgRpm: 85,
  avgSpeedKmh: 24.5,
  calories: 410,
}

const unknownSession: GymSession = {
  consoleType: 'unknown',
  capturedAt: '2026-05-30T10:00:00Z',
}

describe('MetricsCard', () => {
  it('renders rowing session with key metrics', () => {
    render(<MetricsCard session={rowingSession} />)
    expect(screen.getByText('Rowing')).toBeInTheDocument()
    expect(screen.getByText('5000 m')).toBeInTheDocument()
    expect(screen.getByText('2:13.5 /500m')).toBeInTheDocument()
    expect(screen.getByText('285 kcal')).toBeInTheDocument()
    expect(screen.getByText('178 W')).toBeInTheDocument()
  })

  it('renders cycling session with key metrics', () => {
    render(<MetricsCard session={cyclingSession} />)
    expect(screen.getByText('Cycling')).toBeInTheDocument()
    expect(screen.getByText('18.4 km')).toBeInTheDocument()
    expect(screen.getByText('410 kcal')).toBeInTheDocument()
    expect(screen.getByText('165 W')).toBeInTheDocument()
  })

  it('renders unknown console message when consoleType is unknown', () => {
    render(<MetricsCard session={unknownSession} />)
    expect(screen.getByText(/couldn't read console/i)).toBeInTheDocument()
  })

  it('does not render heartRate tile when heartRate is absent', () => {
    render(<MetricsCard session={rowingSession} />)
    expect(screen.queryByText(/bpm/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/components/MetricsCard.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/MetricsCard'`

- [ ] **Step 3: Implement `components/MetricsCard.tsx`**

```typescript
import { GymSession, RowingSession, CyclingSession } from '@/types/metrics'

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function RowingMetrics({ session }: { session: RowingSession }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {session.duration && <Metric label="Duration" value={session.duration} />}
      {session.distanceMeters && <Metric label="Distance" value={`${session.distanceMeters} m`} />}
      {session.splitPer500m && <Metric label="Split" value={`${session.splitPer500m} /500m`} />}
      {session.strokeRate && <Metric label="Stroke Rate" value={`${session.strokeRate} spm`} />}
      {session.watts && <Metric label="Power" value={`${session.watts} W`} />}
      {session.calories && <Metric label="Calories" value={`${session.calories} kcal`} />}
      {session.heartRate && <Metric label="Heart Rate" value={`${session.heartRate} bpm`} />}
    </div>
  )
}

function CyclingMetrics({ session }: { session: CyclingSession }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {session.duration && <Metric label="Duration" value={session.duration} />}
      {session.distanceKm && <Metric label="Distance" value={`${session.distanceKm} km`} />}
      {session.avgWatts && <Metric label="Avg Power" value={`${session.avgWatts} W`} />}
      {session.avgRpm && <Metric label="RPM" value={`${session.avgRpm}`} />}
      {session.avgSpeedKmh && <Metric label="Avg Speed" value={`${session.avgSpeedKmh} km/h`} />}
      {session.calories && <Metric label="Calories" value={`${session.calories} kcal`} />}
      {session.heartRate && <Metric label="Heart Rate" value={`${session.heartRate} bpm`} />}
    </div>
  )
}

export default function MetricsCard({ session }: { session: GymSession }) {
  if (session.consoleType === 'unknown') {
    return (
      <div className="w-full max-w-sm bg-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-400">Couldn't read console — try again in better light</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm bg-gray-900 rounded-xl p-4">
      <h2 className="text-lg font-bold mb-4 capitalize">
        {session.consoleType === 'rowing' ? 'Rowing' : 'Cycling'}
      </h2>
      {session.consoleType === 'rowing'
        ? <RowingMetrics session={session} />
        : <CyclingMetrics session={session} />}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/components/MetricsCard.test.tsx
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/MetricsCard.tsx __tests__/components/MetricsCard.test.tsx
git commit -m "feat: add MetricsCard component"
```

---

## Task 10: Build CameraCapture component (TDD)

**Files:**
- Create: `components/CameraCapture.tsx`
- Create: `__tests__/components/CameraCapture.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/CameraCapture.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/components/CameraCapture.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/CameraCapture'`

- [ ] **Step 3: Implement `components/CameraCapture.tsx`**

```typescript
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
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl text-lg font-semibold disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Analysing…' : 'Capture Console'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/components/CameraCapture.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/CameraCapture.tsx __tests__/components/CameraCapture.test.tsx
git commit -m "feat: add CameraCapture component"
```

---

## Task 11: Wire up home page and layout

**Files:**
- Modify: `app/page.tsx` (replace scaffold content)
- Modify: `app/layout.tsx` (replace scaffold content)
- Modify: `app/globals.css` (keep Tailwind directives, remove demo styles)

- [ ] **Step 1: Replace `app/globals.css`**

Keep only the Tailwind directives, remove everything else:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```typescript
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vision Gym Coach',
  description: 'Capture gym console metrics with your camera',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gym Coach',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Replace `app/page.tsx`**

```typescript
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
```

- [ ] **Step 4: Verify TypeScript and build**

```bash
npx tsc --noEmit
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/layout.tsx app/globals.css
git commit -m "feat: wire up home page with CameraCapture and MetricsCard"
```

---

## Task 12: PWA manifest and final run

**Files:**
- Create: `public/manifest.json`
- Create: `public/icon-192.png` and `public/icon-512.png` (placeholder icons)

- [ ] **Step 1: Create `public/manifest.json`**

```json
{
  "name": "Vision Gym Coach",
  "short_name": "GymCoach",
  "description": "Capture gym console metrics with your camera",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Generate placeholder icons**

Run this in the terminal to create simple placeholder PNGs (requires ImageMagick — if not available, create 192×192 and 512×512 solid-colour PNGs via any tool and save to `public/`):

```bash
# If ImageMagick is available:
convert -size 192x192 xc:#0a0a0a public/icon-192.png
convert -size 512x512 xc:#0a0a0a public/icon-512.png
```

If ImageMagick is not available, create two solid dark-coloured PNG files at those dimensions using any image editor and save them to `public/`.

- [ ] **Step 3: Run the dev server**

```bash
npm run dev
```

Open `http://localhost:3000` in a browser.

- [ ] **Step 4: Verify end-to-end**

Checklist:
- [ ] Page loads with "Gym Coach" heading and "Capture Console" button
- [ ] Clicking the button opens the file picker (on mobile: camera; on desktop: file browser)
- [ ] Selecting a photo of a rowing console POSTs to `/api/parse-session` (check Network tab)
- [ ] A metrics card renders with the correct fields
- [ ] Selecting a non-console image returns `consoleType: "unknown"` and the "Couldn't read console" message
- [ ] Manifest is served at `http://localhost:3000/manifest.json`

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 6: Final commit**

```bash
git add public/manifest.json public/icon-192.png public/icon-512.png
git commit -m "feat: add PWA manifest and placeholder icons"
git tag v0.1.0-phase1
```

---

## Verification Summary

| Check | Command | Expected |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | No errors |
| Unit tests | `npm test` | All pass |
| Build | `npm run build` | Succeeds |
| Dev server | `npm run dev` → localhost:3000 | Page loads |
| API route | POST to `/api/parse-session` with real image | Metrics JSON returned |
| PWA manifest | `localhost:3000/manifest.json` | Valid JSON |
