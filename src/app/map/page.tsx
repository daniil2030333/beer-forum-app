import { Suspense } from 'react'

import ForumLightLogo from '@/components/ForumLightLogo'
import MapClient from './MapClient'
import { sectionHeader } from '@/lib/design-system'

export default function MapPage() {
  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#FAF6F0] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <header className="shrink-0 bg-[#FAF6F0] px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className={sectionHeader.eyebrow}>Expo Map</p>
            <h1 className="text-2xl font-semibold tracking-normal text-[#4A2412]">
              Карта форума
            </h1>
            <p className="text-sm leading-5 text-[#8A654F]">
              Интерактивная карта экспозиции
            </p>
          </div>
          <ForumLightLogo />
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="mx-4 rounded-3xl border border-[#7A3F1D]/15 bg-[#FFFDF8] p-5 text-sm font-medium text-[#8A654F] shadow-sm">
              Загружаем карту...
            </div>
          }
        >
          <MapClient />
        </Suspense>
      </div>
    </main>
  )
}
