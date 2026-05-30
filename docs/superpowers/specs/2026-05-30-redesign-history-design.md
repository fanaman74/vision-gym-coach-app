# Vision Gym Coach — Redesign + History Page Design Spec

**Date:** 2026-05-30  
**Scope:** Phase 2 — Hero redesign, bottom navigation, history page, Supabase session persistence  
**Status:** Approved for implementation

---

## Context

Phase 1 delivered the core capture-and-parse pipeline with a minimal UI. Phase 2 redesigns the visual experience and adds session history. Goals: make the app feel like a real gym product (dark, bold, energetic), give users a way to review past performance, and wire up Supabase for persistence.

---

## Visual Design Language

| Token | Value |
|---|---|
| Background | `#0a0a0a` (black) |
| Accent | `orange-500` (`#f97316`) — buttons, highlights, active nav |
| Text primary | `white` |
| Text secondary | `gray-400` |
| Card background | `gray-900` |
| Border/divider | `gray-800` |

Tailwind v4 utility classes are used throughout. No external UI library.

---

## Navigation

A `BottomNav` component is added to `app/layout.tsx` and renders on every page.

```
[ 🏠 Home ]     [ 📊 History ]
```

- Active tab: orange accent colour + bold label
- Inactive tab: `gray-500`
- Fixed to bottom of viewport (`fixed bottom-0`)
- Pages: `/` (Home) and `/history` (History)

**New file:** `components/BottomNav.tsx` — `'use client'` component, uses `usePathname()` to detect active tab.

---

## Home Page Redesign (`app/page.tsx`)

### Hero Section

- Full-width, `60vh` tall
- Background: Unsplash gym photo via `next/image` with `object-fit: cover`
  - URL: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1280&q=80`
  - (Indoor gym with rowing machines — fits both console types)
- Overlay: `linear-gradient(to bottom, rgba(0,0,0,0.3), #0a0a0a)` so bottom bleeds into page background
- Content overlaid on lower third:
  - `GYM COACH` — large bold white heading
  - `Capture your workout metrics` — small `gray-300` subtext
  - Orange **Capture Console** button (`bg-orange-500 hover:bg-orange-400`)

### Below Hero

- `MetricsCard` appears after a successful scan (no separate section heading needed)
- Error messages in `red-400`
- `pb-20` bottom padding to clear the fixed `BottomNav`

### Session Save

After a successful parse, `save-session.ts` is called to persist the session to Supabase. Failure to save is silent (logged to console, not shown to user — capture result still displays).

---

## History Page (`app/history/page.tsx`)

Server component — fetches sessions from Supabase at request time.

### Summary Row

Three `StatCard` components in a horizontal row:

| Card | Value |
|---|---|
| Workouts | Count of all sessions |
| Distance | Sum of `distanceMeters` (rowing, in km) + `distanceKm` (cycling) formatted to 1 decimal |
| Calories | Sum of all `calories` |

### Session List

Scrollable list of up to 50 most recent sessions, ordered newest first. Each row (`SessionListItem`):

```
[Type icon]  Date (relative: "Today", "Yesterday", "3 days ago")
             Console type · Distance · Calories · Duration
```

- Rowing icon: 🚣  Cycling icon: 🚴
- Dividers between rows (`border-gray-800`)
- Empty state: "No sessions yet — capture your first workout!" centred with orange accent

---

## Supabase Schema

Run this SQL in the Supabase dashboard (SQL Editor) before deploying:

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

---

## New Files

| File | Responsibility |
|---|---|
| `components/BottomNav.tsx` | Fixed bottom navigation, highlights active route |
| `components/StatCard.tsx` | Single summary stat (label + value) |
| `components/SessionListItem.tsx` | One row in the history list |
| `app/history/page.tsx` | History page — server component, fetches + renders sessions |
| `lib/save-session.ts` | Writes a `GymSession` to Supabase `sessions` table |
| `lib/get-sessions.ts` | Fetches last 50 sessions from Supabase, returns typed array |

## Modified Files

| File | Change |
|---|---|
| `app/page.tsx` | Hero section + orange button + call `saveSession` after parse |
| `app/layout.tsx` | Add `<BottomNav />`, add `pb-20` to body to clear nav |
| `components/CameraCapture.tsx` | Update button colour to `bg-orange-500` |
| `components/MetricsCard.tsx` | Update label accent colour to `orange-400` |

---

## Data Flow

```
Home page capture
  → POST /api/parse-session
  → GymSession JSON
  → display MetricsCard
  → lib/save-session.ts → supabase.from('sessions').insert(...)

History page load
  → lib/get-sessions.ts → supabase.from('sessions').select(...)
  → compute totals
  → render StatCards + SessionListItems
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Save to Supabase fails | Silent — `console.error`, session still displayed |
| History fetch fails | Show "Couldn't load history — try again" message |
| No sessions in DB | Show empty state message |
| `session_data` missing optional fields | `SessionListItem` omits those values gracefully |

---

## Verification

1. Home page: hero image renders, gradient overlay visible, orange button present
2. Capture a session → MetricsCard appears → row appears in Supabase `sessions` table
3. Navigate to `/history` → summary cards show correct totals → session list matches Supabase rows
4. Empty state: with no rows, history page shows the empty message
5. `npm test` — all existing tests still pass (no regressions)
6. `npm run build` — clean build
