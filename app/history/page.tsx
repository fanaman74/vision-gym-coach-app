'use client'

import { useState, useMemo, useEffect } from 'react'
import Icon from '@/components/Icon'
import { getSessions } from '@/lib/get-sessions'
import { storedToSplit, SplitSession, formatDuration, formatPace, relTime, ymd } from '@/lib/adapt-session'

/* ── utils ── */
function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="pill" style={{
      cursor: 'pointer',
      background: active ? 'var(--ink)' : 'var(--surface)',
      color: active ? 'var(--bg)' : 'var(--ink)',
      border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
      padding: '8px 14px',
    }}>{children}</button>
  )
}

function SportTag({ sport }: { sport: 'rowing' | 'cycling' }) {
  return (
    <span className={`sport-tag ${sport === 'rowing' ? 'row' : 'cycle'}`}>
      <Icon name={sport === 'rowing' ? 'row' : 'cycle'} size={14} />
      {sport === 'rowing' ? 'ROW' : 'RIDE'}
    </span>
  )
}

/* ── Sparkline ── */
function Sparkline({ data, color, width = 160, height = 40 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data.length) return <div style={{ width, height }} />
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height * 0.9}`)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ── Animated number ── */
function AnimatedNumber({ value, format = (n: number) => Math.round(n) }: { value: number; format?: (n: number) => string | number }) {
  return <span>{format(value)}</span>
}

/* ─────────────── DASHBOARD ─────────────── */
function PRItem({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="tag" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 'clamp(28px,3.6vw,44px)', letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 6, letterSpacing: 0.5 }}>{sub}</div>
    </div>
  )
}

function BigStat({ label, value, unit, format = (n: number) => Math.round(n), theme = 'plain' }: {
  label: string; value: number; unit: string; format?: (n: number) => string | number; big?: boolean; theme?: string
}) {
  type ThemeConfig = { bg: string; fg: string; faint: string; border: string; glass?: boolean }
  const THEMES: Record<string, ThemeConfig> = {
    plain:  { bg: 'var(--surface)', fg: 'var(--ink)', faint: 'var(--ink-faint)', border: '1px solid var(--line)', glass: true },
    violet: { bg: 'var(--violet)', fg: '#fff', faint: 'rgba(255,255,255,.72)', border: 'none' },
    cyan:   { bg: 'var(--cyan)', fg: '#06201f', faint: 'rgba(6,32,31,.6)', border: 'none' },
    ink:    { bg: 'var(--ink)', fg: 'var(--bg)', faint: 'rgba(255,255,255,.5)', border: 'none' },
    grad:   { bg: 'var(--grad)', fg: '#fff', faint: 'rgba(255,255,255,.8)', border: 'none' },
  }
  const th = THEMES[theme] ?? THEMES.plain
  return (
    <div className={th.glass ? 'surface' : ''} style={{
      padding: 'var(--pad-card)',
      background: th.bg, color: th.fg,
      border: th.border, borderRadius: 'var(--radius)',
      boxShadow: th.glass ? undefined : 'var(--shadow)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div className="tag" style={{ color: th.faint }}>{label}</div>
      <div className="stat-num" style={{ marginTop: 10 }}>
        <AnimatedNumber value={value} format={n => format(n)} />
      </div>
      <div className="stat-unit" style={{ marginTop: 8, color: th.faint }}>{unit}</div>
    </div>
  )
}

function SportSummary({ sport, sessions }: { sport: 'rowing' | 'cycling'; sessions: SplitSession[] }) {
  const totalDist = sessions.reduce((s, r) => s + r.distance, 0)
  const avgDist = sessions.length ? totalDist / sessions.length : 0
  const isRow = sport === 'rowing'
  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const sparkData = sorted.slice(-8).map(r => r.distance)

  return (
    <div className="surface" style={{
      padding: 'var(--pad-card)',
      background: isRow ? 'var(--ink)' : 'var(--surface)',
      color: isRow ? 'var(--bg)' : 'var(--ink)',
      borderColor: isRow ? 'var(--ink)' : 'var(--line)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <SportTag sport={sport} />
        <span className="mono" style={{ fontSize: 12, opacity: 0.6 }}>{sessions.length} SESSIONS</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div className="stat-unit" style={{ color: isRow ? 'rgba(255,248,240,0.6)' : 'var(--ink-faint)' }}>Total</div>
          <div className="stat-num" style={{ fontSize: 44, color: isRow ? 'var(--primary)' : 'var(--ink)' }}>
            {(totalDist / 1000).toFixed(1)}<span style={{ fontSize: 18, marginLeft: 4, opacity: 0.6 }}>km</span>
          </div>
        </div>
        <div>
          <div className="stat-unit" style={{ color: isRow ? 'rgba(255,248,240,0.6)' : 'var(--ink-faint)' }}>Avg</div>
          <div className="stat-num" style={{ fontSize: 44, color: isRow ? 'var(--bg)' : 'var(--ink)' }}>
            {Math.round(avgDist / (isRow ? 1 : 1000)) || 0}<span style={{ fontSize: 18, marginLeft: 4, opacity: 0.6 }}>{isRow ? 'm' : 'km'}</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div className="tag" style={{ color: isRow ? 'rgba(255,248,240,0.6)' : 'var(--ink-faint)' }}>RECENT</div>
        <Sparkline data={sparkData} color={isRow ? 'var(--primary)' : 'var(--ink)'} />
      </div>
    </div>
  )
}

function Dashboard({ results }: { results: SplitSession[] }) {
  const stats = useMemo(() => {
    const totalDur = results.reduce((s, r) => s + r.duration, 0)
    const totalDist = results.reduce((s, r) => s + r.distance, 0)
    const rowing = results.filter(r => r.sport === 'rowing')
    const cycling = results.filter(r => r.sport === 'cycling')
    const bestRow5k = [...rowing].filter(r => r.distance >= 4800 && r.distance <= 5200).sort((a, b) => a.duration - b.duration)[0]
    const longestRide = [...cycling].sort((a, b) => b.distance - a.distance)[0]
    const fastestRow = [...rowing].filter(r => r.distance > 0).sort((a, b) => (a.duration / a.distance) - (b.duration / b.distance))[0]
    const days = new Set(results.map(r => ymd(r.date)))
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 60; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      if (days.has(ymd(d))) streak++
      else if (i > 0) break
    }
    return { totalDur, totalDist, totalSessions: results.length, rowing, cycling, bestRow5k, longestRide, fastestRow, streak }
  }, [results])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--gap-grid)' }}>
        <BigStat label="Sessions" value={stats.totalSessions} unit="logged" theme="violet" />
        <BigStat label="Total time" value={stats.totalDur} format={n => formatDuration(Math.round(n))} unit="ALL SPORTS" theme="ink" />
        <BigStat label="Distance" value={stats.totalDist / 1000} format={n => n.toFixed(1)} unit="KM TRAVELED" theme="cyan" />
        <BigStat label="Streak" value={stats.streak} unit={stats.streak === 1 ? 'DAY 🔥' : 'DAYS 🔥'} theme="grad" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--gap-grid)' }}>
        <SportSummary sport="rowing" sessions={stats.rowing} />
        <SportSummary sport="cycling" sessions={stats.cycling} />
      </div>
      <div className="surface" style={{ padding: 'var(--pad-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Icon name="trophy" size={20} style={{ color: 'var(--primary)' }} />
          <span className="tag">PERSONAL RECORDS</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          <PRItem label="Fastest 5K row" value={stats.bestRow5k ? formatDuration(stats.bestRow5k.duration) : '—'} sub={stats.bestRow5k ? relTime(stats.bestRow5k.date) : 'no entries yet'} />
          <PRItem label="Longest ride" value={stats.longestRide ? (stats.longestRide.distance / 1000).toFixed(1) + ' km' : '—'} sub={stats.longestRide ? formatDuration(stats.longestRide.duration) : '—'} />
          <PRItem label="Best row pace" value={stats.fastestRow ? formatPace(stats.fastestRow.duration, stats.fastestRow.distance) + ' /500m' : '—'} sub={stats.fastestRow ? relTime(stats.fastestRow.date) : '—'} />
        </div>
      </div>
    </div>
  )
}

/* ─────────────── SESSIONS ─────────────── */
function SessionCard({ result, layout, index }: { result: SplitSession; layout: string; index: number }) {
  const isRow = result.sport === 'rowing'
  const isList = layout === 'list'
  return (
    <div className="hist-card" style={{ animation: `fade-up 0.4s ${index * 30}ms backwards cubic-bezier(.2,.7,.3,1)` }}>
      {isList ? (
        <>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: isRow ? 'var(--primary)' : 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={isRow ? 'row' : 'cycle'} size={28} />
          </div>
          <div>
            <SportTag sport={result.sport} />
            <div style={{ marginTop: 8, fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em' }}>
              {(result.distance / 1000).toFixed(2)} km · {formatDuration(result.duration)}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
              {new Date(result.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="stat-unit">PACE</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{formatPace(result.duration, result.distance)}</div>
          </div>
          <div className="tag">{result.source === 'camera' ? '📷 SHOT' : '↥ UPLOAD'}</div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SportTag sport={result.sport} />
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{relTime(result.date)}</span>
          </div>
          <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 'clamp(36px,4vw,52px)', letterSpacing: '-0.03em', lineHeight: 0.95, fontVariantNumeric: 'tabular-nums' }}>
            {(result.distance / 1000).toFixed(2)}<span style={{ fontSize: '0.4em', color: 'var(--ink-faint)', marginLeft: 6 }}>KM</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <div><div className="stat-unit">TIME</div><div className="mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{formatDuration(result.duration)}</div></div>
            <div><div className="stat-unit">PACE</div><div className="mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{formatPace(result.duration, result.distance)}</div></div>
          </div>
        </>
      )}
    </div>
  )
}

function SessionsView({ results, layout }: { results: SplitSession[]; layout: string }) {
  const sorted = [...results].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  if (!sorted.length) return <p style={{ color: 'var(--ink-faint)', textAlign: 'center', padding: '48px 0' }}>No sessions yet — go capture one!</p>
  return (
    <div className={layout === 'list' ? 'layout-list' : 'layout-grid'}>
      {sorted.map((r, i) => <SessionCard key={r.id} result={r} layout={layout} index={i} />)}
    </div>
  )
}

/* ─────────────── CALENDAR ─────────────── */
function CalendarView({ results }: { results: SplitSession[] }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const today = new Date()
  const month = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)

  const byDay = useMemo(() => {
    const map: Record<string, SplitSession[]> = {}
    results.forEach(r => { const k = ymd(r.date); if (!map[k]) map[k] = []; map[k].push(r) })
    return map
  }, [results])

  const days: Array<null | { d: number; key: string; sessions: SplitSession[] }> = []
  const firstDay = month.getDay()
  const offsetStart = firstDay === 0 ? 6 : firstDay - 1
  for (let i = 0; i < offsetStart; i++) days.push(null)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  for (let d = 1; d <= last; d++) {
    const dt = new Date(month.getFullYear(), month.getMonth(), d)
    days.push({ d, key: ymd(dt), sessions: byDay[ymd(dt)] ?? [] })
  }

  return (
    <div className="surface" style={{ padding: 'var(--pad-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div className="tag">CALENDAR</div>
          <h3 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 36, letterSpacing: '-0.02em', marginTop: 4 }}>
            {month.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost" onClick={() => setMonthOffset(mo => mo - 1)} style={{ padding: '8px 14px' }}>‹</button>
          <button className="btn btn-ghost" onClick={() => setMonthOffset(0)} style={{ padding: '8px 14px' }}>Today</button>
          <button className="btn btn-ghost" onClick={() => setMonthOffset(mo => mo + 1)} style={{ padding: '8px 14px' }}>›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 8 }}>
        {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => <div key={d} className="tag" style={{ textAlign: 'center', padding: '4px 0' }}>{d}</div>)}
      </div>
      <div className="cal-grid">
        {days.map((day, i) => {
          if (!day) return <div key={i} className="cal-cell empty" />
          const count = day.sessions.length
          const intensity = count === 0 ? 0 : Math.min(4, count + (day.sessions.some(s => s.distance > 10000) ? 1 : 0))
          const isToday = day.key === ymd(today)
          return (
            <div key={i} className="cal-cell" data-intensity={intensity}
              style={{ outline: isToday ? '2px solid var(--ink)' : 'none', outlineOffset: '-2px', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span>{String(day.d).padStart(2,'0')}</span>
              {count > 0 && (
                <div style={{ display: 'flex', gap: 2, alignSelf: 'flex-end' }}>
                  {day.sessions.slice(0, 3).map((s, j) => (
                    <span key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: intensity >= 2 ? 'white' : (s.sport === 'rowing' ? 'var(--primary)' : 'var(--ink)') }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line)', alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="tag">INTENSITY</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0,1,2,3,4].map(i => <div key={i} className="cal-cell" data-intensity={i} style={{ width: 18, height: 18, aspectRatio: 'auto', padding: 0 }} />)}
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>less → more</span>
      </div>
    </div>
  )
}

/* ─────────────── CHARTS ─────────────── */
function ChartsView({ results }: { results: SplitSession[] }) {
  const sorted = useMemo(() => [...results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [results])
  const last14 = useMemo(() => {
    const today = new Date(); const out = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const k = ymd(d)
      const daySessions = sorted.filter(r => ymd(r.date) === k)
      out.push({ label: d.toLocaleString('en-US', { weekday: 'short' }), row: daySessions.filter(r => r.sport === 'rowing').reduce((s, r) => s + r.distance, 0), cycle: daySessions.filter(r => r.sport === 'cycling').reduce((s, r) => s + r.distance, 0) })
    }
    return out
  }, [sorted])
  const maxDist = Math.max(...last14.map(d => d.row + d.cycle), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
      <div className="surface" style={{ padding: 'var(--pad-card)' }}>
        <div className="tag" style={{ marginBottom: 16 }}>14-DAY DISTANCE</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
          {last14.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
                {d.row > 0 && <div className="bar row-bar" style={{ height: `${(d.row / maxDist) * 100}%`, minHeight: 4 }} />}
                {d.cycle > 0 && <div className="bar cycle-bar" style={{ height: `${(d.cycle / maxDist) * 100}%`, minHeight: 4 }} />}
                {d.row === 0 && d.cycle === 0 && <div className="bar" style={{ height: 4 }} />}
              </div>
              <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{d.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)' }} /><span className="tag">ROW</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--ink)' }} /><span className="tag">RIDE</span></div>
        </div>
      </div>

      {sorted.length >= 3 && (
        <div className="surface" style={{ padding: 'var(--pad-card)' }}>
          <div className="tag" style={{ marginBottom: 16 }}>PACE TREND (ROWING)</div>
          <div style={{ height: 120 }}>
            <Sparkline
              data={sorted.filter(r => r.sport === 'rowing' && r.distance > 0).map(r => r.distance / r.duration * 500)}
              color="var(--primary)" width={600} height={120}
            />
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 8 }}>metres per 500m pace over time — higher = faster</div>
        </div>
      )}
    </div>
  )
}

/* ─────────────── HISTORY PAGE ─────────────── */
export const dynamic = 'force-dynamic'

export default function HistoryPage() {
  const [results, setResults] = useState<SplitSession[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [view, setView] = useState<'dashboard' | 'cards' | 'calendar' | 'charts'>('dashboard')
  const [filter, setFilter] = useState<'all' | 'rowing' | 'cycling'>('all')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    getSessions()
      .then(rows => setResults(rows.map(storedToSplit)))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[history] getSessions failed:', msg)
        setFetchError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return results
    return results.filter(r => r.sport === filter)
  }, [results, filter])

  return (
    <div className="container screen" style={{ paddingTop: 36, paddingBottom: 96 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <span className="tag">PERSONAL LEDGER</span>
          <h1 className="hero-head" style={{ fontSize: 'clamp(56px,9vw,120px)', marginTop: 8 }}>
            All your <em>reps.</em>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterPill>
          <FilterPill active={filter === 'rowing'} onClick={() => setFilter('rowing')}>
            <Icon name="row" size={14} /> Rowing
          </FilterPill>
          <FilterPill active={filter === 'cycling'} onClick={() => setFilter('cycling')}>
            <Icon name="cycle" size={14} /> Cycling
          </FilterPill>
        </div>
      </div>

      {/* View switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: 4, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--line)', width: 'fit-content', flexWrap: 'wrap' }}>
        {([
          { id: 'dashboard', label: 'Dashboard', icon: 'sparkle' },
          { id: 'cards',     label: 'Sessions',  icon: layout === 'list' ? 'list' : 'grid' },
          { id: 'calendar',  label: 'Calendar',  icon: 'cal' },
          { id: 'charts',    label: 'Charts',    icon: 'chart' },
        ] as const).map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: '8px 14px', borderRadius: 8,
            background: view === v.id ? 'var(--ink)' : 'transparent',
            color: view === v.id ? 'var(--bg)' : 'var(--ink-soft)',
            border: 0, fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          }}>
            <Icon name={v.icon} size={14} />{v.label}
          </button>
        ))}
        {view === 'cards' && (
          <button onClick={() => setLayout(l => l === 'grid' ? 'list' : 'grid')} style={{
            padding: '8px 14px', borderRadius: 8, background: 'transparent',
            color: 'var(--ink-soft)', border: 0, fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          }}>
            <Icon name={layout === 'grid' ? 'list' : 'grid'} size={14} />
          </button>
        )}
      </div>

      {loading && <p style={{ color: 'var(--ink-faint)', textAlign: 'center', padding: '48px 0' }}>Loading…</p>}
      {fetchError && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: 8 }}>Couldn&apos;t load sessions</p>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all' }}>{fetchError}</p>
        </div>
      )}

      {!loading && !fetchError && (
        <>
          {view === 'dashboard' && <Dashboard results={filtered} />}
          {view === 'cards'     && <SessionsView results={filtered} layout={layout} />}
          {view === 'calendar'  && <CalendarView results={filtered} />}
          {view === 'charts'    && <ChartsView results={filtered} />}
        </>
      )}

      {!loading && !fetchError && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 48 }}>🏋️</div>
          <p style={{ color: 'var(--ink-faint)', marginTop: 16 }}>No sessions yet — snap your first workout!</p>
        </div>
      )}
    </div>
  )
}
