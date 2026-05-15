'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, CalendarDays, MapPinned, Mic2, UserRound } from 'lucide-react'

const tabs = [
  { label: 'Программа', href: '/', Icon: CalendarDays },
  { label: 'Спикеры', href: '/speakers', Icon: Mic2 },
  { label: 'Экспо', href: '/companies', Icon: Building2 },
  { label: 'Карта', href: '/map', Icon: MapPinned },
  { label: 'Me', href: '/me', Icon: UserRound },
]

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#7A3F1D]/15 bg-[#FFFDF8]/95 shadow-[0_-8px_24px_rgba(74,36,18,0.06)]"
      style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto grid h-16 max-w-3xl grid-cols-5 gap-1 px-2 py-2">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href)
          const Icon = tab.Icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium transition-colors ${
                active ? 'bg-[#FFF4E6] text-[#7A3F1D]' : 'text-[#A7795F] hover:bg-[#FFF4E6]/60'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={2} />
              <span className="truncate">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
