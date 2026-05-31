'use client'

import { useMemo } from 'react'
import Icon from './Icon'
import { SplitSession, formatDuration, formatPace, relTime, ymd } from '@/lib/adapt-session'

function paceSeconds(r: SplitSession): number {
  return r.distance > 0 ? (r.duration * (r.sport === 'rowing' ? 500 : 1000)) / r.distance : 0
}

function fmtClock(s: number): string {
  const m = Math.floor(s / 60), sec = Math.round(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{label.toUpperCase()}</span>
    </span>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="stat-unit" style={{ color: 'rgba(255,255,255,.45)' }}>{label}</div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 2, color: color ?? 'inherit' }}>{value}</div>
    </div>
  )
}

function LastSessionCard({ r, all }: { r: SplitSession; all: SplitSession[] }) {
  const isRow = r.sport === 'rowing'
  const prevSame = all.filter(x => x.sport === r.sport && x.id !== r.id)
  const lastPace = paceSeconds(r)
  const avgPace = prevSame.length
    ? prevSame.reduce((s, x) => s + paceSeconds(x), 0) / prevSame.length
    : lastPace
  const delta = avgPace ? ((avgPace - lastPace) / avgPace) * 100 : 0
  const faster = delta >= 0

  return (
    <div style={{
      padding: 'var(--pad-card)', borderRadius: 'var(--radius)',
      background: 'var(--ink)', color: 'var(--bg)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden', minHeight: 240,
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="tag" style={{ color: 'var(--primary)' }}>● LAST SESSION</span>
        <span className="mono" style={{ fontSize: 11, opacity: 0.55 }}>{relTime(r.date)}</span>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: isRow ? 'var(--primary)' : 'var(--violet)' }}>
          <Icon name={isRow ? 'row' : 'cycle'} size={20} />
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {isRow ? 'Rowing' : 'Cycling'}
          </span>
        </div>
        <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 'clamp(40px,6vw,64px)', letterSpacing: '-0.04em', lineHeight: 0.92, fontVariantNumeric: 'tabular-nums' }}>
          {(r.distance / 1000).toFixed(2)}
          <span style={{ fontSize: '0.35em', opacity: 0.5, marginLeft: 8 }}>KM</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.12)' }}>
        <MiniStat label="Time" value={formatDuration(r.duration)} />
        <MiniStat label="Pace" value={formatPace(r.duration, r.distance)} />
        <MiniStat label="vs avg" value={`${faster ? '▲' : '▼'} ${Math.abs(delta).toFixed(0)}%`} color={faster ? '#7dffb0' : '#ff9a9a'} />
      </div>
    </div>
  )
}

function AllEntries({ results }: { results: SplitSession[] }) {
  return (
    <div className="surface" style={{ marginTop: 'var(--gap-grid)', padding: 'var(--pad-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="tag">ALL ENTRIES · {results.length}</div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>scroll ↓</span>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto', margin: '0 calc(var(--pad-card) * -1)', padding: '0 var(--pad-card)' }}>
        {results.map((r, i) => {
          const isRow = r.sport === 'rowing'
          return (
            <div key={r.id} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 16, alignItems: 'center',
              padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: isRow ? 'color-mix(in oklab, var(--primary) 16%, transparent)' : 'color-mix(in oklab, var(--violet) 16%, transparent)',
                color: isRow ? 'var(--primary)' : 'var(--violet)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={isRow ? 'row' : 'cycle'} size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
                  {(r.distance / 1000).toFixed(2)} km
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 1 }}>
                  {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' · '}{r.source === 'camera' ? '📷' : '↥'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{formatDuration(r.duration)}</div>
                <div className="stat-unit">time</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 56 }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{formatPace(r.duration, r.distance)}</div>
                <div className="stat-unit">{isRow ? '/500m' : '/km'}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface Props {
  results: SplitSession[]
}

export default function RecentActivity({ results }: Props) {
  const sorted = useMemo(
    () => [...results].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [results]
  )
  const last = sorted[0]

  const days = useMemo(() => {
    const out: { key: string; date: Date; row: number; cycle: number }[] = []
    const today = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      out.push({ key: ymd(d), date: d, row: 0, cycle: 0 })
    }
    results.forEach(r => {
      const day = out.find(d => d.key === ymd(r.date))
      if (day) day[r.sport === 'rowing' ? 'row' : 'cycle'] += r.distance
    })
    return out
  }, [results])

  const maxBar = Math.max(...days.map(d => d.row + d.cycle), 1)
  const total14 = days.reduce((s, d) => s + d.row + d.cycle, 0) / 1000

  if (!last) return (
    <section style={{ marginTop: 96 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <span className="tag">RECENT ACTIVITY</span>
          <h2 className="hero-head" style={{ fontSize: 'clamp(40px,6vw,72px)', marginTop: 8 }}>
            Your last <em>14 days.</em>
          </h2>
        </div>
      </div>
      <div className="surface" style={{ marginTop: 28, padding: 'var(--pad-card)', textAlign: 'center', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto' }}>
          <Icon name="chart" size={28} />
        </div>
        <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 22 }}>No sessions yet</div>
        <div style={{ color: 'var(--ink-soft)', fontSize: 15, maxWidth: 340 }}>Tap the orb above to snap your first console screen — your chart fills in from there.</div>
      </div>
    </section>
  )

  return (
    <section style={{ marginTop: 96 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <span className="tag">RECENT ACTIVITY</span>
          <h2 className="hero-head" style={{ fontSize: 'clamp(40px,6vw,72px)', marginTop: 8 }}>
            Your last <em>14 days.</em>
          </h2>
        </div>
        <span className="pill dot">{results.length} sessions logged</span>
      </div>

      {/* Last session + chart grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0,.85fr) minmax(0,1.15fr)',
        gap: 'var(--gap-grid)', marginTop: 28,
      }} className="ra-grid">
        <LastSessionCard r={last} all={sorted} />

        {/* 14-day chart */}
        <div className="surface" style={{ padding: 'var(--pad-card)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="tag">DISTANCE PER DAY</div>
              <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 36, letterSpacing: '-0.02em', marginTop: 4 }}>
                {total14.toFixed(1)} km
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <LegendDot color="var(--primary)" label="Row" />
              <LegendDot color="var(--violet)" label="Ride" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, height: 180, alignItems: 'flex-end', flex: 1 }}>
            {days.map((d, i) => {
              const rowH = (d.row / maxBar) * 100
              const cyH = (d.cycle / maxBar) * 100
              const has = d.row + d.cycle > 0
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ height: 150, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
                    {cyH > 0 && <div className="bar" style={{ height: `${cyH}%`, background: 'var(--violet)' }} />}
                    {rowH > 0 && <div className="bar row-bar" style={{ height: `${rowH}%` }} />}
                    {!has && <div style={{ height: 3, width: '100%', background: 'var(--line)', borderRadius: 2 }} />}
                  </div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{d.date.getDate()}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <AllEntries results={sorted} />

      <style>{`@media (max-width: 880px){ .ra-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}
