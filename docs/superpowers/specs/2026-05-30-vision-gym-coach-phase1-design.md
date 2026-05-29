# Vision Gym Coach — Phase 1 Design Spec

**Date:** 2026-05-30  
**Scope:** Phase 1 — Capture + Parse only (no coaching, no history)  
**Status:** Approved for implementation

---

## Context

A PWA for use at the gym on a mobile phone. The user photographs a rowing monitor or indoor cycling console screen; the app extracts structured performance metrics using a vision AI model and displays them in a clean card. Phase 1 establishes the core image-to-metrics pipeline. Coaching feedback and session history are deferred to later phases.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend + API routes | React + Next.js (App Router) |
| AI vision | OpenRouter (model configurable via `OPENROUTER_MODEL` env var, default `google/gemini-2.0-flash`) |
| Database / storage | Supabase — client initialized but no writes in Phase 1 |
| Auth | None in Phase 1 (anonymous) |
| Hosting | Vercel (Next.js native) |

---

## Project Structure

```
mygymapp/
├── app/
│   ├── page.tsx                      # Home: capture button + last result
│   ├── layout.tsx                    # PWA shell, viewport meta
│   └── api/
│       └── parse-session/
│           └── route.ts              # POST handler: image → OpenRouter → metrics JSON
├── components/
│   ├── CameraCapture.tsx             # Camera input trigger + image preview
│   └── MetricsCard.tsx               # Renders RowingSession or CyclingSession
├── lib/
│   ├── openrouter.ts                 # OpenRouter API client wrapper
│   ├── prompts.ts                    # Vision prompt templates
│   └── supabase.ts                   # Supabase client (ready for Phase 2)
├── types/
│   └── metrics.ts                    # GymSession, RowingSession, CyclingSession types
├── public/
│   └── manifest.json                 # PWA manifest
└── .env.local                        # OPENROUTER_API_KEY, OPENROUTER_MODEL,
                                      # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Data Types

```typescript
type ConsoleType = 'rowing' | 'cycling' | 'unknown'

interface BaseSession {
  consoleType: ConsoleType
  capturedAt: string        // ISO timestamp
  imageDataUrl?: string     // held in React state only, never persisted
}

interface RowingSession extends BaseSession {
  consoleType: 'rowing'
  duration: string          // "00:22:15"
  distanceMeters: number
  splitPer500m: string      // "2:12.4"
  strokeRate: number        // strokes per minute
  calories: number
  watts: number
  heartRate?: number
}

interface CyclingSession extends BaseSession {
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

type GymSession = RowingSession | CyclingSession
```

Optional fields are omitted (never guessed) if not visible in the image.

---

## Core Pipeline

```
CameraCapture (client)
  → resize image to max 1280px wide (client-side, Canvas API)
  → POST /api/parse-session  { image: base64, mimeType: "image/jpeg" }

/api/parse-session (server)
  → lib/prompts.ts  builds vision prompt
  → lib/openrouter.ts  calls OpenRouter vision model
  → returns GymSession JSON

page.tsx (client)
  → receives GymSession
  → renders MetricsCard
```

---

## Vision Prompt Design (`lib/prompts.ts`)

System instructions to the model:

1. Identify the console type: `rowing`, `cycling`, or `unknown`
2. Extract all visible metrics exactly as shown on screen
3. Return **only** valid JSON matching the schema — no prose, no markdown fences
4. For any field that is not clearly readable: **omit it entirely** — never guess
5. If the image is not a recognised gym console: return `{ "consoleType": "unknown" }`

---

## Error Handling

| Scenario | API response | UI behaviour |
|---|---|---|
| Console unrecognised / blurry | `{ consoleType: "unknown" }` (200) | "Couldn't read console — try again in better light" |
| OpenRouter API error | 500 `{ error: "AI service unavailable" }` | Retry button shown |
| Image too large (client) | Resized before send (no error) | Transparent to user |
| Network offline | fetch throws | "No connection — results will appear when you're back online" |

---

## Camera Capture

Uses `<input type="file" accept="image/*" capture="environment">` — most reliable cross-browser PWA trigger on mobile. No MediaDevices API complexity in Phase 1.

Client resizes the captured image to max 1280px wide using the Canvas API before POSTing, keeping payloads small on mobile networks.

---

## PWA Setup

- `next-pwa` plugin for service worker + offline shell
- `public/manifest.json`: `display: standalone`, `orientation: portrait`
- Offline behaviour: app shell loads, capture disabled with "offline" message

---

## Verification

1. `npm run dev` — app loads on localhost
2. Open on mobile (or Chrome DevTools mobile emulation)
3. Tap capture → select a photo of a rowing or cycling console
4. Metrics card renders with correct fields populated
5. Try a blurry/non-console photo → "Couldn't read console" message shown
6. Check Network tab — image POST to `/api/parse-session`, JSON response
7. Lighthouse PWA audit passes (manifest, service worker, HTTPS on Vercel)
