'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Icon from '@/components/Icon'
import { GymSession } from '@/types/metrics'
import { saveSession } from '@/lib/save-session'
import { resizeImage } from '@/lib/resize-image'
import { gymSessionToSplit, formatDuration, formatPace, SplitSession, storedToSplit } from '@/lib/adapt-session'
import RecentActivity from '@/components/RecentActivity'
import CoachSection from '@/components/CoachSection'
import { getSessions } from '@/lib/get-sessions'

/* ─── helpers ─── */
function parseDurString(s: string): number {
  const parts = s.split(':').map(p => parseInt(p, 10) || 0)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] ?? 0
}

/* ─── types ─── */
type Stage = 'idle' | 'scanning' | 'review' | 'error'

/* ─── Scan step row ─── */
function ScanStep({ label, delay }: { label: string; delay: number }) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setDone(true), delay + 400)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 10,
      background: 'var(--surface)', border: '1px solid var(--line)', fontSize: 14,
      animation: `fade-up 0.5s ${delay}ms backwards cubic-bezier(.2,.7,.3,1)`,
    }}>
      <span className="mono" style={{ fontSize: 12, letterSpacing: 0.5, color: 'var(--ink-soft)' }}>
        {label.toUpperCase()}
      </span>
      <span style={{ color: done ? 'var(--primary)' : 'var(--ink-faint)' }}>
        {done ? <Icon name="check" size={16} /> : <span className="mono" style={{ fontSize: 11 }}>…</span>}
      </span>
    </div>
  )
}

/* ─── Parsed field card ─── */
interface ParsedFieldProps {
  label: string; icon: string; value: string; unit: string
  editing: boolean; readonly?: boolean
  onEdit: () => void
  onChange?: (raw: number) => void
  fieldType: 'duration' | 'distance'
  rawValue: number
}

function ParsedField({ label, icon, value, unit, editing, readonly, onEdit, onChange, fieldType, rawValue }: ParsedFieldProps) {
  return (
    <div style={{
      padding: 'var(--pad-card)', borderRadius: 16,
      background: 'var(--surface)', border: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary)', flexShrink: 0,
        }}>
          <Icon name={icon} size={22} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="tag" style={{ marginBottom: 4 }}>{label}</div>
          {editing ? (
            <input
              autoFocus
              type={fieldType === 'duration' ? 'text' : 'number'}
              defaultValue={fieldType === 'duration' ? formatDuration(rawValue) : String(rawValue)}
              onBlur={e => {
                const v = e.target.value
                if (fieldType === 'duration') {
                  onChange?.(parseDurString(v))
                } else {
                  onChange?.(parseInt(v, 10) || 0)
                }
                onEdit()
              }}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              style={{
                fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
                fontSize: 36, letterSpacing: '-0.02em',
                background: 'transparent', border: 0, outline: 0,
                color: 'var(--ink)', width: '100%', padding: 0,
                borderBottom: '2px solid var(--primary)',
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
                fontSize: 36, letterSpacing: '-0.02em', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>{value}</span>
              {unit && <span className="stat-unit">{unit}</span>}
            </div>
          )}
        </div>
      </div>
      {!readonly && (
        <button onClick={onEdit} style={{
          padding: '8px 12px', borderRadius: 999,
          background: 'transparent', border: '1px solid var(--line-strong)',
          color: 'var(--ink-soft)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          {editing ? 'Done' : 'Edit'}
        </button>
      )}
    </div>
  )
}

/* ─── Review panel ─── */
interface ReviewPanelProps {
  gymSession: GymSession
  sport: 'rowing' | 'cycling'
  setSport: (s: 'rowing' | 'cycling') => void
  durationSecs: number
  distanceM: number
  setDurationSecs: (n: number) => void
  setDistanceM: (n: number) => void
  onSave: () => void
  confidence: number
}

function ReviewPanel({ gymSession, sport, setSport, durationSecs, distanceM, setDurationSecs, setDistanceM, onSave, confidence }: ReviewPanelProps) {
  const [editing, setEditing] = useState<'duration' | 'distance' | null>(null)

  const displayDist = distanceM >= 1000
    ? (distanceM / 1000).toFixed(2)
    : String(Math.round(distanceM))
  const distUnit = distanceM >= 1000 ? 'KM' : 'M'

  return (
    <div className="stagger">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1F8A5B', flexShrink: 0 }} />
        <span className="tag" style={{ color: '#1F8A5B' }}>
          SCAN COMPLETE · {Math.round(confidence * 100)}% MATCH
        </span>
      </div>

      {/* Sport picker */}
      <div style={{ display: 'flex', gap: 8, margin: '14px 0 20px' }}>
        {(['rowing', 'cycling'] as const).map(s => (
          <button key={s} onClick={() => setSport(s)} style={{
            flex: 1, padding: '12px 14px', borderRadius: 12,
            border: `1.5px solid ${sport === s ? 'var(--ink)' : 'var(--line)'}`,
            background: sport === s ? 'var(--ink)' : 'var(--surface)',
            color: sport === s ? 'var(--bg)' : 'var(--ink)',
            fontFamily: 'inherit', fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
          }}>
            <Icon name={s === 'rowing' ? 'row' : 'cycle'} size={18} />
            {s === 'rowing' ? 'Row' : 'Ride'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ParsedField
          label="Time" icon="timer"
          value={formatDuration(durationSecs)} unit=""
          editing={editing === 'duration'}
          onEdit={() => setEditing(editing === 'duration' ? null : 'duration')}
          onChange={setDurationSecs}
          fieldType="duration" rawValue={durationSecs}
        />
        <ParsedField
          label="Distance" icon="ruler"
          value={displayDist} unit={distUnit}
          editing={editing === 'distance'}
          onEdit={() => setEditing(editing === 'distance' ? null : 'distance')}
          onChange={v => setDistanceM(sport === 'cycling' && v < 500 ? v * 1000 : v)}
          fieldType="distance" rawValue={distanceM}
        />
        <ParsedField
          label="Avg pace" icon="bolt"
          value={formatPace(durationSecs, distanceM)}
          unit={sport === 'rowing' ? '/ 500M' : '/ KM'}
          editing={false} readonly
          onEdit={() => {}}
          fieldType="distance" rawValue={0}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        <button className="btn btn-primary" onClick={onSave} style={{ flex: 1, padding: '16px 20px', fontSize: 15 }}>
          <Icon name="check" size={18} /> Save to history
        </button>
      </div>
    </div>
  )
}

/* ─── Main page ─── */
export default function CapturePage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [gymSession, setGymSession] = useState<GymSession | null>(null)
  const [sport, setSport] = useState<'rowing' | 'cycling'>('rowing')
  const [durationSecs, setDurationSecs] = useState(0)
  const [distanceM, setDistanceM] = useState(0)
  const [confidence] = useState(0.92)
  const [dragging, setDragging] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SplitSession[]>([])
  const [historySessions, setHistorySessions] = useState<SplitSession[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  /* drag-and-drop */
  useEffect(() => {
    const onEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) { dragCounter.current++; setDragging(true) }
    }
    const onLeave = () => {
      dragCounter.current = Math.max(0, dragCounter.current - 1)
      if (dragCounter.current === 0) setDragging(false)
    }
    const onDrop = (e: DragEvent) => {
      dragCounter.current = 0; setDragging(false); e.preventDefault()
      const f = e.dataTransfer?.files?.[0]
      if (f && f.type.startsWith('image/')) handleFile(f)
    }
    const onOver = (e: DragEvent) => e.preventDefault()
    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('drop', onDrop)
    window.addEventListener('dragover', onOver)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('dragover', onOver)
    }
  }, [])

  useEffect(() => {
    getSessions()
      .then(rows => setHistorySessions(rows.map(storedToSplit)))
      .catch(() => {}) // silent — sections just won't render
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setStage('scanning')
    setErrorMsg(null)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    try {
      const { base64, mimeType } = await resizeImage(file, 1280)
      const res = await fetch('/api/parse-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'AI service unavailable')
      }
      const data: GymSession = await res.json()
      setGymSession(data)
      const detectedSport: 'rowing' | 'cycling' = data.consoleType === 'cycling' ? 'cycling' : 'rowing'
      setSport(detectedSport)
      // Extract duration and distance from parsed session
      const durStr = (data as { duration?: string }).duration
      const secs = durStr ? durStr.split(':').map(Number).reduce((a, b, i, arr) => {
        if (arr.length === 3) return i === 0 ? b * 3600 : i === 1 ? a + b * 60 : a + b
        return i === 0 ? b * 60 : a + b
      }, 0) : 0
      setDurationSecs(secs)
      const dist = detectedSport === 'rowing'
        ? ((data as { distanceMeters?: number }).distanceMeters ?? 0)
        : ((data as { distanceKm?: number }).distanceKm ?? 0) * 1000
      setDistanceM(dist)
      setStage('review')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStage('error')
    }
  }, [])

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null); setGymSession(null); setStage('idle'); setErrorMsg(null)
  }

  const handleSave = () => {
    if (!gymSession) return
    saveSession(gymSession)
    const split = gymSessionToSplit('local-' + Date.now(), gymSession, new Date().toISOString())
    setSessions(prev => [split, ...prev])
    setHistorySessions(prev => [split, ...prev])
    reset()
    window.location.href = '/history'
  }

  return (
    <div className="screen" style={{ paddingTop: 48, paddingBottom: 96 }}>

      {/* ── IDLE ── */}
      {stage === 'idle' && (
        <div className="container">
          <div className="stagger">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28 }}>
              <span className="pill dot">LIVE SESSION LOG</span>
              <span className="tag">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
            </div>
            <h1 className="hero-head">
              Snap it.<br />
              <em>Log it.</em><br />
              Crush it.
            </h1>
            <p style={{ fontSize: 20, color: 'var(--ink-soft)', maxWidth: 560, marginTop: 28, lineHeight: 1.4 }}>
              Point your phone at the erg or the bike. We&apos;ll grab the{' '}
              <strong style={{ color: 'var(--ink)' }}>time</strong> and{' '}
              <strong style={{ color: 'var(--ink)' }}>distance</strong>, you keep the bragging rights.
            </p>
          </div>

          {/* CTA orb */}
          <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button className="cta-orb" onClick={() => cameraInputRef.current?.click()} aria-label="Open camera">
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <Icon name="camera" size={48} />
                  <div className="orb-label" style={{ marginTop: 6 }}>TAP TO SHOOT</div>
                </div>
              </button>
              <svg className="spin-label" viewBox="0 0 300 300" width="300" height="300">
                <defs>
                  <path id="circ" d="M150,150 m-130,0 a130,130 0 1,1 260,0 a130,130 0 1,1 -260,0" />
                </defs>
                <text fontSize="14" fill="var(--ink-faint)" fontFamily="JetBrains Mono" fontWeight="500" letterSpacing="6">
                  <textPath href="#circ">
                    READY · CAMERA · DRAG · DROP · UPLOAD · READY · CAMERA · DRAG · DROP · UPLOAD ·{' '}
                  </textPath>
                </text>
              </svg>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
                <Icon name="upload" size={18} /> Upload from device
              </button>
              <span className="tag">OR DRAG AN IMAGE ANYWHERE</span>
            </div>
          </div>

          {/* Supported devices */}
          <div style={{ marginTop: 88 }}>
            <div className="tag" style={{ marginBottom: 16 }}>WORKS WITH</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {[
                { name: 'Concept2 PM5', sub: 'ROW · SKI · BIKE ERG', icon: 'row' },
                { name: 'Peloton Bike+', sub: 'CYCLING · LANEBREAK', icon: 'cycle' },
                { name: 'Wahoo KICKR', sub: 'CYCLING · ZWIFT', icon: 'cycle' },
                { name: 'Hydrow / RowErg', sub: 'ROWING · INDOOR', icon: 'row' },
              ].map((d, i) => (
                <div key={i} style={{
                  padding: 18, borderRadius: 16, border: '1px solid var(--line)',
                  background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: 'var(--bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                  }}>
                    <Icon name={d.icon} size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2, letterSpacing: 0.5 }}>{d.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <RecentActivity results={historySessions} />
          <CoachSection results={historySessions} />
        </div>
      )}

      {/* ── SCANNING ── */}
      {(stage === 'scanning' || stage === 'review') && (
        <div className="container screen">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <button className="pill" onClick={reset} style={{ cursor: 'pointer' }}>
              <Icon name="x" size={12} /> Cancel
            </button>
            <span className="tag">
              {stage === 'scanning' ? 'SCANNING THE SCREEN…' : 'REVIEW & SAVE'}
            </span>
          </div>

          <div
            className="capture-grid"
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: 32, alignItems: 'start' }}
          >
            {/* Image preview */}
            <div className="capture-frame has-image" style={{ aspectRatio: 'auto', maxHeight: '70vh' }}>
              {previewUrl && (
                <img src={previewUrl} alt="Captured console" style={{
                  display: 'block', width: '100%', height: '100%', maxHeight: '70vh',
                  objectFit: 'contain', background: 'var(--ink)',
                }} />
              )}
              <div className="bracket bracket-tl" style={{ borderColor: 'var(--primary)' }} />
              <div className="bracket bracket-tr" style={{ borderColor: 'var(--primary)' }} />
              <div className="bracket bracket-bl" style={{ borderColor: 'var(--primary)' }} />
              <div className="bracket bracket-br" style={{ borderColor: 'var(--primary)' }} />
              {stage === 'scanning' && <div className="scan-line" />}
            </div>

            {/* Right panel */}
            <div>
              {stage === 'scanning' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse-ring 1.2s ease-out infinite' }} />
                    <span className="tag" style={{ color: 'var(--primary)' }}>READING DISPLAY</span>
                  </div>
                  <h2 className="hero-head" style={{ fontSize: 'clamp(40px,6vw,80px)' }}>
                    Crunching<br />the numbers…
                  </h2>
                  <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {['Locating panel', 'Detecting layout', 'Extracting time', 'Extracting distance', 'Cross-checking pace'].map((s, i) => (
                      <ScanStep key={i} label={s} delay={i * 350} />
                    ))}
                  </div>
                </div>
              )}

              {stage === 'review' && gymSession && (
                <ReviewPanel
                  gymSession={gymSession}
                  sport={sport} setSport={setSport}
                  durationSecs={durationSecs} distanceM={distanceM}
                  setDurationSecs={setDurationSecs} setDistanceM={setDistanceM}
                  onSave={handleSave} confidence={confidence}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {stage === 'error' && (
        <div className="container" style={{ textAlign: 'center', paddingTop: 64 }}>
          <h2 className="hero-head" style={{ fontSize: 'clamp(40px,6vw,80px)' }}>Hmm.</h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 16, fontSize: 18 }}>{errorMsg}</p>
          <button className="btn btn-primary" onClick={reset} style={{ marginTop: 32 }}>
            <Icon name="x" size={18} /> Try again
          </button>
        </div>
      )}

      {/* ── DROP OVERLAY ── */}
      <div className={`drop-overlay ${dragging ? 'active' : ''}`}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 96, letterSpacing: '-0.04em', lineHeight: 0.9 }}>
            DROP IT.
          </div>
          <div style={{ marginTop: 12, fontSize: 18, opacity: 0.9, fontWeight: 600 }}>
            We&apos;ll read the screen for you.
          </div>
        </div>
      </div>

      {/* ── hidden file inputs ── */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
    </div>
  )
}
