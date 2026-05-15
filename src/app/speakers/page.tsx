import SpeakersList from '@/components/SpeakersList'
import { sectionHeader } from '@/lib/design-system'

export default function SpeakersPage() {
  return (
    <main className="min-h-screen bg-[#FAF6EF] pb-24">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-3">
        <div className="space-y-2">
          <p className={sectionHeader.eyebrow}>Спикеры</p>
          <h1 className={sectionHeader.title}>Ключевые участники</h1>
          <p className={sectionHeader.subtitle}>
            Найдите выступления и профиль спикера на конференции.
          </p>
        </div>

        <SpeakersList />
      </div>
    </main>
  )
}
