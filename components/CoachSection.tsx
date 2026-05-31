'use client'

import { useMemo } from 'react'
import Icon from './Icon'
import { SplitSession, formatDuration, formatPace, ymd } from '@/lib/adapt-session'

function paceSeconds(r: SplitSession): number {
  return r.distance > 0 ? (r.duration * (r.sport === 'rowing' ? 500 : 1000)) / r.distance : 0
}
function fmtClock(s: number): string {
  const m = Math.floor(s / 60), sec = Math.round(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

interface AdviceCard {
  tone: 'cyan' | 'violet' | 'ink' | 'grad' | 'primary'
  icon: string
  kicker: string
  title: string
  body: string
}

const TONES: Record<string, { bg: string; fg: string; faint: string }> = {
  primary: { bg: 'var(--primary)', fg: '#fff', faint: 'rgba(255,255,255,.7)' },
  cyan:    { bg: 'var(--cyan)',    fg: '#06201f', faint: 'rgba(6,32,31,.6)' },
  violet:  { bg: 'var(--violet)', fg: '#fff',    faint: 'rgba(255,255,255,.72)' },
  grad:    { bg: 'var(--grad)',    fg: '#fff',    faint: 'rgba(255,255,255,.8)' },
  ink:     { bg: 'var(--ink)',     fg: 'var(--bg)', faint: 'rgba(255,255,255,.5)' },
}

function buildAdvice(results: SplitSession[]): AdviceCard[] {
  if (!results.length) return []
  const sorted = [...results].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const last = sorted[0]
  const now = new Date()
  const daysSince = Math.floor((now.getTime() - new Date(last.date).getTime()) / 86400000)

  const dset = new Set(sorted.map(r => ymd(r.date)))
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(now); d.setDate(now.getDate() - i)
    if (dset.has(ymd(d))) streak++
    else if (i > 0) break
  }

  const last5 = sorted.slice(0, 5)
  const rowN = last5.filter(r => r.sport === 'rowing').length
  const cyN  = last5.filter(r => r.sport === 'cycling').length

  const sameSport = sorted.filter(r => r.sport === last.sport)
  const lastPace = paceSeconds(last)
  const prevSame = sameSport.slice(1)
  const avgPace = prevSame.length
    ? prevSame.reduce((s, r) => s + paceSeconds(r), 0) / prevSame.length
    : lastPace
  const paceDelta = avgPace ? ((avgPace - lastPace) / avgPace) * 100 : 0

  const cards: AdviceCard[] = []

  // 1 — recency
  if (daysSince >= 3) {
    cards.push({ tone: 'cyan', icon: 'bolt', kicker: 'GET MOVING',
      title: `${daysSince} days since your last session`,
      body: `Momentum fades fast. A short ${last.sport === 'rowing' ? '2K row' : '20-min spin'} today is enough to protect your aerobic base.` })
  } else if (streak >= 5) {
    cards.push({ tone: 'cyan', icon: 'flame', kicker: 'RECOVER',
      title: `${streak}-day streak — that's serious`,
      body: `Adaptation happens at rest. Slot an easy day or light mobility before your body forces one on you.` })
  } else {
    cards.push({ tone: 'cyan', icon: 'check', kicker: 'STAY ON IT',
      title: `Consistency looks good`,
      body: `${streak} day${streak === 1 ? '' : 's'} on the trot. Book your next session now while the habit's warm.` })
  }

  // 2 — pace trend
  if (paceDelta >= 2) {
    cards.push({ tone: 'violet', icon: 'sparkle', kicker: 'TRENDING UP',
      title: `${paceDelta.toFixed(0)}% faster than your ${last.sport} average`,
      body: `Last ${fmtClock(lastPace)} vs ${fmtClock(avgPace)} ${last.sport === 'rowing' ? '/500m' : '/km'}. Repeat this effort once more, then push the ceiling.` })
  } else if (paceDelta <= -3) {
    cards.push({ tone: 'violet', icon: 'chart', kicker: 'PACE DIP',
      title: `${Math.abs(paceDelta).toFixed(0)}% slower than usual`,
      body: `Likely fatigue or a long effort. Sharpen back up with 4×500m hard / 90s easy next time out.` })
  } else {
    cards.push({ tone: 'violet', icon: 'chart', kicker: 'PLATEAU',
      title: `Your ${last.sport} pace is holding steady`,
      body: `Right on your average. Add a 10-minute tempo block to nudge the line back down.` })
  }

  // 3 — balance
  if (rowN === 0) {
    cards.push({ tone: 'ink', icon: 'row', kicker: 'BALANCE',
      title: `Your rowing's gone quiet`,
      body: `All bike lately. One row this week balances posterior-chain load and builds your engine differently.` })
  } else if (cyN === 0) {
    cards.push({ tone: 'ink', icon: 'cycle', kicker: 'BALANCE',
      title: `Time to add a ride`,
      body: `Lots of erg work. A cycling session keeps aerobic volume up while giving the joints a break.` })
  } else {
    cards.push({ tone: 'ink', icon: 'sparkle', kicker: 'BALANCE',
      title: `${rowN} rows / ${cyN} rides — nice mix`,
      body: `That variety builds a resilient engine and keeps boredom away. Keep alternating.` })
  }

  // 4 — mission
  const bestPace = Math.min(...sameSport.filter(r => r.distance > 0).map(paceSeconds))
  if (last.sport === 'rowing') {
    const dists = sameSport.map(r => r.distance).sort((a, b) => a - b)
    const med = dists[Math.floor(dists.length / 2)] ?? 5000
    const tgtDist = med >= 4000 ? 5000 : med >= 1500 ? 2000 : 1000
    const tgtPace = bestPace * 0.985
    const tgtTime = Math.round(tgtPace * tgtDist / 500)
    cards.push({ tone: 'grad', icon: 'trophy', kicker: 'YOUR MISSION',
      title: `Row ${tgtDist / 1000}K under ${formatDuration(tgtTime)}`,
      body: `That's a ${fmtClock(tgtPace)}/500m pace — about 1.5% under your best. Negative-split it: hold back early, empty the tank on the final 500.` })
  } else {
    const longest = Math.max(...sameSport.map(r => r.distance), 1000)
    const tgtDist = Math.ceil((longest * 1.08) / 1000) * 1000
    const tgtPace = bestPace * 0.985
    const tgtTime = Math.round(tgtPace * tgtDist / 1000)
    cards.push({ tone: 'grad', icon: 'trophy', kicker: 'YOUR MISSION',
      title: `Ride ${tgtDist / 1000} km under ${formatDuration(tgtTime)}`,
      body: `Hold ${fmtClock(tgtPace)}/km and you'll bank a new distance PR. Fuel 30 min before you roll and settle into the effort early.` })
  }

  return cards.slice(0, 4)
}

export default function CoachSection({ results }: { results: SplitSession[] }) {
  const advice = useMemo(() => buildAdvice(results), [results])

  if (!advice.length) return null

  return (
    <section style={{ marginTop: 96 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <span className="tag">YOUR COACH</span>
          <h2 className="hero-head" style={{ fontSize: 'clamp(40px,6vw,72px)', marginTop: 8 }}>
            Based on your <em>last sessions.</em>
          </h2>
        </div>
        <span className="pill dot">updates every entry</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--gap-grid)', marginTop: 28 }}>
        {advice.map((c, i) => {
          const t = TONES[c.tone] ?? TONES.ink
          return (
            <div key={i} style={{
              padding: 'var(--pad-card)', borderRadius: 'var(--radius)',
              background: t.bg, color: t.fg, boxShadow: 'var(--shadow)',
              display: 'flex', flexDirection: 'column', minHeight: 220,
              animation: `fade-up 0.5s ${i * 80}ms backwards cubic-bezier(.2,.7,.3,1)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(255,255,255,.16)', color: t.fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={c.icon} size={24} />
                </div>
                <span className="tag" style={{ color: t.faint }}>{c.kicker}</span>
              </div>
              <h3 style={{
                fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
                fontSize: 'clamp(22px,2.4vw,28px)', letterSpacing: '-0.02em',
                lineHeight: 1.02, margin: '20px 0 10px',
              }}>{c.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.45, color: t.faint, margin: 0 }}>{c.body}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
