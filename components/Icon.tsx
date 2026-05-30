interface IconProps {
  name: string
  size?: number
  style?: React.CSSProperties
  className?: string
}

const PATHS: Record<string, React.ReactNode> = {
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  upload: <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
  row: <><path d="M4 20l4-4m0 0l4-4m-4 4l4 4M12 12l4-4m0 0l4-4m-4 4l4 4"/><circle cx="19" cy="5" r="2"/></>,
  cycle: <><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></>,
  timer: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  ruler: <><line x1="2" y1="20" x2="22" y2="4"/><path d="M17 8l-2 2m-2.5 2.5L10 15"/></>,
  bolt: <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  fire: <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>,
  sparkle: <><path d="M12 3l1.09 3.26L16 7.5l-2.91.24L12 11l-1.09-3.26L8 7.5l2.91-.24L12 3z"/><path d="M5 12l.55 1.64L7 14.5l-1.45.12L5 16l-.55-1.64L3 14.5l1.45-.12L5 12z"/></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 000 5H6"/><path d="M18 9h1.5a2.5 2.5 0 010 5H18"/><path d="M4 2h16v7a8 8 0 01-16 0V2z"/><line x1="9" y1="17" x2="15" y2="17"/><line x1="12" y1="17" x2="12" y2="22"/><line x1="9" y1="22" x2="15" y2="22"/></>,
  chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  cal: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
  list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
}

export default function Icon({ name, size = 24, style, className }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className}
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
