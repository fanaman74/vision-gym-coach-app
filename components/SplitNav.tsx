'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from './Icon'

const MARQUEE_ITEMS = [
  'Push your splits', 'Snap. Log. Repeat.',
  '5K · 10K · meters don\'t lie', 'Watts up',
  'One more round', 'Erg or bike — both count',
]

interface Props {
  sessionCount?: number
}

export default function SplitNav({ sessionCount = 0 }: Props) {
  const pathname = usePathname()
  const isCapture = pathname === '/'
  const isHistory = pathname === '/history'

  return (
    <nav className="split-nav">
      <div className="nav-inner">
        {/* Logo */}
        <div className="logo">
          <span className="logo-mark"><span>S</span></span>
          <span>SPLIT</span>
          <span className="tag hide-mobile" style={{ marginLeft: 8, paddingLeft: 12, borderLeft: '1px solid var(--line-strong)' }}>
            ROW · RIDE · REPEAT
          </span>
        </div>

        {/* Tabs */}
        <div className="nav-tabs">
          <Link href="/" className="nav-tab" data-active={isCapture ? 'true' : 'false'}>
            Capture
          </Link>
          <Link href="/history" className="nav-tab" data-active={isHistory ? 'true' : 'false'}>
            History
          </Link>
        </div>

        {/* Session count pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hide-mobile">
          <span className="pill">
            <Icon name="fire" size={14} style={{ color: 'var(--primary)' }} />
            <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{sessionCount}</span>
          </span>
        </div>
      </div>

      {/* Marquee */}
      <div className="marquee">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>
    </nav>
  )
}
