# Redesign + History Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the home page with a full-bleed gym hero, add bottom navigation, persist sessions to Supabase, and build a history page showing total stats and a session list.

**Architecture:** New lib functions (`save-session`, `get-sessions`) wrap the existing Supabase client. New UI components (`StatCard`, `SessionListItem`, `BottomNav`) are composed into a server-rendered `/history` page. The home page gains a hero section and calls `saveSession` fire-and-forget after each successful capture.

**Tech Stack:** Next.js 16 App Router, Tailwind v4, Supabase JS v2, `next/image` for the hero photo

---

## ⚠️ Prerequisite — Run Supabase SQL before Task 2

Before implementing any code, create the `sessions` table in your Supabase project. Open the Supabase dashboard → SQL Editor → New query, paste and run:

```sql
create table sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  console_type text not null,
  session_data jsonb not null
);

alter table sessions enable row level security;
create policy "anon insert" on sessions for insert to anon with check (true);
create policy "anon select" on sessions for select to anon using (true);
```

Also make sure `.env.local` has real values (not placeholders) for:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `next.config.ts` | Modify | Allow `images.unsplash.com` for `next/image` |
| `lib/save-session.ts` | Create | Insert a `GymSession` into Supabase `sessions` table |
| `lib/get-sessions.ts` | Create | Fetch last 50 sessions from Supabase, return typed array |
| `components/StatCard.tsx` | Create | Single summary stat tile (label + value) |
| `components/SessionListItem.tsx` | Create | One row in the history session list |
| `components/BottomNav.tsx` | Create | Fixed bottom nav: Home / History tabs |
| `app/history/page.tsx` | Create | Server component — totals + session list |
| `app/page.tsx` | Modify | Add hero section, call `saveSession` after capture |
| `app/layout.tsx` | Modify | Add `<BottomNav />` |
| `components/CameraCapture.tsx` | Modify | Blue → orange button |
| `components/MetricsCard.tsx` | Modify | Gray → orange metric labels |

---

## Task 1: Allow Unsplash images in Next.js config

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Update `next.config.ts`**

Replace the entire file content:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: Verify build still passes**

```bash
cd /Users/fred/Documents/VibeCoding/claudecode/mygymapp
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: allow images.unsplash.com in next/image"
```

---

## Task 2: Save-session library function (TDD)

**Files:**
- Create: `lib/save-session.ts`
- Create: `__tests__/lib/save-session.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/save-session.test.ts`:

```typescript
import { saveSession } from '@/lib/save-session'
import { supabase } from '@/lib/supabase'
import { RowingSession } from '@/types/metrics'

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>

const mockSession: RowingSession = {
  consoleType: 'rowing',
  capturedAt: '2026-05-30T10:00:00Z',
  duration: '00:22:15',
  distanceMeters: 5000,
  splitPer500m: '2:13.5',
  strokeRate: 24,
  calories: 285,
  watts: 178,
}

describe('saveSession', () => {
  beforeEach(() => jest.clearAllMocks())

  it('inserts console_type and session_data into the sessions table', async () => {
    const mockInsert = jest.fn().mockResolvedValueOnce({ error: null })
    mockFrom.mockReturnValueOnce({ insert: mockInsert } as any)

    await saveSession(mockSession)

    expect(mockFrom).toHaveBeenCalledWith('sessions')
    expect(mockInsert).toHaveBeenCalledWith({
      console_type: 'rowing',
      session_data: mockSession,
    })
  })

  it('logs error but does not throw when insert fails', async () => {
    const mockInsert = jest.fn().mockResolvedValueOnce({ error: { message: 'DB error' } })
    mockFrom.mockReturnValueOnce({ insert: mockInsert } as any)
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    await expect(saveSession(mockSession)).resolves.toBeUndefined()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/lib/save-session.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/save-session'`

- [ ] **Step 3: Implement `lib/save-session.ts`**

```typescript
import { supabase } from './supabase'
import { GymSession } from '@/types/metrics'

export async function saveSession(session: GymSession): Promise<void> {
  const { error } = await supabase.from('sessions').insert({
    console_type: session.consoleType,
    session_data: session,
  })
  if (error) {
    console.error('[saveSession]', error)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/lib/save-session.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/save-session.ts __tests__/lib/save-session.test.ts
git commit -m "feat: add saveSession Supabase helper"
```

---

## Task 3: Get-sessions library function (TDD)

**Files:**
- Create: `lib/get-sessions.ts`
- Create: `__tests__/lib/get-sessions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/get-sessions.test.ts`:

```typescript
import { getSessions } from '@/lib/get-sessions'
import { supabase } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>

const mockRows = [
  {
    id: 'abc-123',
    created_at: '2026-05-30T10:00:00Z',
    console_type: 'rowing',
    session_data: {
      consoleType: 'rowing',
      capturedAt: '2026-05-30T10:00:00Z',
      distanceMeters: 5000,
      calories: 285,
    },
  },
]

function makeMockChain(result: { data: typeof mockRows | null; error: { message: string } | null }) {
  return {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValueOnce(result),
  }
}

describe('getSessions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('fetches sessions ordered by created_at desc, limited to 50', async () => {
    const chain = makeMockChain({ data: mockRows, error: null })
    mockFrom.mockReturnValueOnce(chain as any)

    const result = await getSessions()

    expect(mockFrom).toHaveBeenCalledWith('sessions')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(chain.limit).toHaveBeenCalledWith(50)
    expect(result).toEqual(mockRows)
  })

  it('throws when Supabase returns an error', async () => {
    const chain = makeMockChain({ data: null, error: { message: 'Connection failed' } })
    mockFrom.mockReturnValueOnce(chain as any)

    await expect(getSessions()).rejects.toThrow('Failed to fetch sessions: Connection failed')
  })

  it('returns empty array when data is null with no error', async () => {
    const chain = makeMockChain({ data: null, error: null })
    mockFrom.mockReturnValueOnce(chain as any)

    expect(await getSessions()).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/lib/get-sessions.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/get-sessions'`

- [ ] **Step 3: Implement `lib/get-sessions.ts`**

```typescript
import { supabase } from './supabase'
import { GymSession } from '@/types/metrics'

export interface StoredSession {
  id: string
  created_at: string
  console_type: string
  session_data: GymSession
}

export async function getSessions(): Promise<StoredSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`)
  }

  return data ?? []
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/lib/get-sessions.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/get-sessions.ts __tests__/lib/get-sessions.test.ts
git commit -m "feat: add getSessions Supabase helper"
```

---

## Task 4: StatCard component (TDD)

**Files:**
- Create: `components/StatCard.tsx`
- Create: `__tests__/components/StatCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/StatCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import StatCard from '@/components/StatCard'

describe('StatCard', () => {
  it('renders the value and label', () => {
    render(<StatCard label="Workouts" value="12" />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Workouts')).toBeInTheDocument()
  })

  it('renders a different label and value', () => {
    render(<StatCard label="Calories" value="3,240" />)
    expect(screen.getByText('3,240')).toBeInTheDocument()
    expect(screen.getByText('Calories')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/components/StatCard.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/StatCard'`

- [ ] **Step 3: Implement `components/StatCard.tsx`**

```typescript
interface Props {
  label: string
  value: string
}

export default function StatCard({ label, value }: Props) {
  return (
    <div className="flex-1 bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-1">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 text-center">{label}</p>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/components/StatCard.test.tsx
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/StatCard.tsx __tests__/components/StatCard.test.tsx
git commit -m "feat: add StatCard component"
```

---

## Task 5: SessionListItem component (TDD)

**Files:**
- Create: `components/SessionListItem.tsx`
- Create: `__tests__/components/SessionListItem.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/SessionListItem.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import SessionListItem from '@/components/SessionListItem'
import { StoredSession } from '@/lib/get-sessions'

const rowingStored: StoredSession = {
  id: 'test-123',
  created_at: new Date().toISOString(),
  console_type: 'rowing',
  session_data: {
    consoleType: 'rowing',
    capturedAt: new Date().toISOString(),
    duration: '00:22:15',
    distanceMeters: 5000,
    splitPer500m: '2:13.5',
    strokeRate: 24,
    calories: 285,
    watts: 178,
  },
}

const cyclingStored: StoredSession = {
  id: 'test-456',
  created_at: new Date().toISOString(),
  console_type: 'cycling',
  session_data: {
    consoleType: 'cycling',
    capturedAt: new Date().toISOString(),
    duration: '00:45:00',
    distanceKm: 18.4,
    avgWatts: 165,
    avgRpm: 85,
    avgSpeedKmh: 24.5,
    calories: 410,
  },
}

describe('SessionListItem', () => {
  it('renders rowing session with type label, distance and calories', () => {
    render(<SessionListItem session={rowingStored} />)
    expect(screen.getByText('Rowing')).toBeInTheDocument()
    expect(screen.getByText(/5,000 m/)).toBeInTheDocument()
    expect(screen.getByText(/285 kcal/)).toBeInTheDocument()
  })

  it('renders cycling session with distance in km', () => {
    render(<SessionListItem session={cyclingStored} />)
    expect(screen.getByText('Cycling')).toBeInTheDocument()
    expect(screen.getByText(/18\.4 km/)).toBeInTheDocument()
    expect(screen.getByText(/410 kcal/)).toBeInTheDocument()
  })

  it('shows "Today" for sessions created now', () => {
    render(<SessionListItem session={rowingStored} />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/components/SessionListItem.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/SessionListItem'`

- [ ] **Step 3: Implement `components/SessionListItem.tsx`**

```typescript
import { StoredSession } from '@/lib/get-sessions'

interface Props {
  session: StoredSession
}

function formatRelativeDate(dateStr: string): string {
  const diffDays = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

function getHeadlineMetric(session: StoredSession): string {
  const data = session.session_data
  if (data.consoleType === 'rowing' && 'distanceMeters' in data && data.distanceMeters) {
    return `${data.distanceMeters.toLocaleString()} m`
  }
  if (data.consoleType === 'cycling' && 'distanceKm' in data && data.distanceKm) {
    return `${data.distanceKm} km`
  }
  return '—'
}

export default function SessionListItem({ session }: Props) {
  const data = session.session_data
  const icon = data.consoleType === 'rowing' ? '🚣' : data.consoleType === 'cycling' ? '🚴' : '🏋️'
  const typeLabel =
    data.consoleType === 'rowing' ? 'Rowing' : data.consoleType === 'cycling' ? 'Cycling' : 'Unknown'
  const calories = 'calories' in data && data.calories ? `${data.calories} kcal` : null
  const duration = 'duration' in data && (data as { duration?: string }).duration
    ? (data as { duration: string }).duration
    : null

  return (
    <div className="flex items-start gap-3 py-4 border-b border-gray-800 last:border-0">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">{typeLabel}</p>
          <p className="text-xs text-gray-500">{formatRelativeDate(session.created_at)}</p>
        </div>
        <p className="text-sm text-gray-400 mt-0.5">
          {[getHeadlineMetric(session), calories, duration].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/components/SessionListItem.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/SessionListItem.tsx __tests__/components/SessionListItem.test.tsx
git commit -m "feat: add SessionListItem component"
```

---

## Task 6: BottomNav component (TDD)

**Files:**
- Create: `components/BottomNav.tsx`
- Create: `__tests__/components/BottomNav.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/BottomNav.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/components/BottomNav.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/BottomNav'`

- [ ] **Step 3: Implement `components/BottomNav.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/history', label: 'History', icon: '📊' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 flex z-50">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-orange-500' : 'text-gray-500'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/components/BottomNav.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/BottomNav.tsx __tests__/components/BottomNav.test.tsx
git commit -m "feat: add BottomNav component"
```

---

## Task 7: History page

**Files:**
- Create: `app/history/page.tsx`

No unit tests for this server component — it's verified by running the app and checking the page renders with correct totals.

- [ ] **Step 1: Create `app/history/page.tsx`**

```typescript
import { getSessions, StoredSession } from '@/lib/get-sessions'
import StatCard from '@/components/StatCard'
import SessionListItem from '@/components/SessionListItem'

function computeTotals(sessions: StoredSession[]) {
  let totalDistance = 0
  let totalCalories = 0

  for (const s of sessions) {
    const data = s.session_data
    if (data.consoleType === 'rowing' && 'distanceMeters' in data && data.distanceMeters) {
      totalDistance += (data as { distanceMeters: number }).distanceMeters / 1000
    }
    if (data.consoleType === 'cycling' && 'distanceKm' in data && data.distanceKm) {
      totalDistance += (data as { distanceKm: number }).distanceKm
    }
    if ('calories' in data && (data as { calories?: number }).calories) {
      totalCalories += (data as { calories: number }).calories
    }
  }

  return {
    workouts: sessions.length,
    distance: totalDistance.toFixed(1),
    calories: totalCalories.toLocaleString(),
  }
}

export default async function HistoryPage() {
  let sessions: StoredSession[] = []
  let fetchError = false

  try {
    sessions = await getSessions()
  } catch {
    fetchError = true
  }

  const totals = computeTotals(sessions)

  return (
    <main className="min-h-screen bg-gray-950 text-white pb-20">
      <div className="px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold">Your Performance</h1>
      </div>

      <div className="px-4 flex gap-3 mb-6">
        <StatCard label="Workouts" value={String(totals.workouts)} />
        <StatCard label="Distance (km)" value={totals.distance} />
        <StatCard label="Calories" value={totals.calories} />
      </div>

      <div className="px-4">
        {fetchError && (
          <p className="text-red-400 text-sm text-center py-8">
            Couldn&apos;t load history — try again
          </p>
        )}

        {!fetchError && sessions.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="text-4xl">🏋️</span>
            <p className="text-gray-400 text-center">
              No sessions yet — capture your first workout!
            </p>
          </div>
        )}

        {!fetchError && sessions.length > 0 && (
          <div>
            {sessions.map((session) => (
              <SessionListItem key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/fred/Documents/VibeCoding/claudecode/mygymapp
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/history/page.tsx
git commit -m "feat: add history page with session list and stat totals"
```

---

## Task 8: Home page hero redesign

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```typescript
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
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redesign home page with full-bleed gym hero"
```

---

## Task 9: Wire up BottomNav in layout + update accent colours

**Files:**
- Modify: `app/layout.tsx`
- Modify: `components/CameraCapture.tsx`
- Modify: `components/MetricsCard.tsx`

- [ ] **Step 1: Update `app/layout.tsx`** — add `BottomNav` import and render it

Replace the entire file:

```typescript
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'

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
      <body className={inter.className}>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Update `components/CameraCapture.tsx`** — change button from blue to orange

Change only the `className` on the `<button>` element. Find this line:

```typescript
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl text-lg font-semibold disabled:opacity-50 transition-colors"
```

Replace with:

```typescript
        className="px-8 py-4 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 rounded-xl text-lg font-semibold disabled:opacity-50 transition-colors"
```

- [ ] **Step 3: Update `components/MetricsCard.tsx`** — change metric label from gray to orange

In the `Metric` function, find:

```typescript
      <p className="text-xs text-gray-400 mb-1">{label}</p>
```

Replace with:

```typescript
      <p className="text-xs text-orange-400 mb-1">{label}</p>
```

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: all tests pass (existing 21 + new tests from Tasks 2–6 = 31 total).

- [ ] **Step 5: Run final build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx components/CameraCapture.tsx components/MetricsCard.tsx
git commit -m "feat: add BottomNav to layout and apply orange accent colours"
```

- [ ] **Step 7: Push to GitHub**

```bash
git push
```

---

## Verification Checklist

| Check | How to verify |
|---|---|
| Hero image loads | Open `http://localhost:3000` — gym photo fills top 60vh |
| Gradient blends | Bottom of hero fades into black page background |
| Orange button | Capture button is orange, not blue |
| Bottom nav | Home and History tabs visible, Home tab is orange |
| Capture saves | After scan, check Supabase dashboard → Table Editor → sessions |
| History totals | Navigate to `/history` — stat cards show correct counts |
| Session list | Past sessions appear in order, newest first |
| Empty state | With no sessions, history shows "No sessions yet" message |
| History tab active | Tap History tab — tab turns orange |
| All tests pass | `npm test` — 31 tests, all green |
