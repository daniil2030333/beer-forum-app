import { Suspense } from 'react'

import ExpoMap from '@/components/map/ExpoMap'
import { sectionHeader } from '@/lib/design-system'

export default function MapPage() {
  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#FAF6EF] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <header className="shrink-0 bg-[#FAF6EF] px-4 py-3">
        <div className="mx-auto max-w-5xl space-y-1">
          <p className={sectionHeader.eyebrow}>Expo Map</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#4A2412]">
            Карта форума
          </h1>
          <p className="text-sm leading-5 text-[#8A654F]">
            Найдите стенд по номеру или названию компании.
          </p>
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
          <ExpoMap />
        </Suspense>
      </div>
    </main>
  )
}
