import type { Metadata, Viewport } from 'next'
import './globals.css'
import AuroraBackground from '@/components/AuroraBackground'
import SplitNav from '@/components/SplitNav'

export const metadata: Metadata = {
  title: 'SPLIT — Rowing & Cycling Logger',
  description: 'Snap your erg or bike screen. We log the numbers.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SPLIT',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f4f1ff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuroraBackground />
        <SplitNav />
        {children}
      </body>
    </html>
  )
}
