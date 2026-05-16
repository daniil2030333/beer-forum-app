'use client'

import dynamic from 'next/dynamic'

const ExpoMap = dynamic(() => import('@/components/map/ExpoMap'), {
  ssr: false,
  loading: () => (
    <div className="mx-4 rounded-3xl border border-[#7A3F1D]/15 bg-[#FFFDF8] p-5 text-sm font-medium text-[#8A654F] shadow-sm">
      Загружаем карту...
    </div>
  ),
})

export default function MapClient() {
  return <ExpoMap />
}
