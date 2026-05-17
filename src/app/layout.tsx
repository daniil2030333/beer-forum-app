import './globals.css'
import type { Metadata, Viewport } from 'next'
import BottomNav from '@/components/BottomNav'
import UserRoleGate from '@/components/UserRoleGate'

export const metadata: Metadata = {
  title: 'ПИВО-2026',
  description: 'Мобильное приложение Международного форума ПИВО-2026',
  applicationName: 'ПИВО-2026',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'ПИВО-2026',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#7A3F1D',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <UserRoleGate>
          <div className="mobile-app-shell">{children}</div>
          <BottomNav />
        </UserRoleGate>
      </body>
    </html>
  )
}
