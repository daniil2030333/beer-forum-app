import CompaniesList from '@/components/CompaniesList'
import { sectionHeader } from '@/lib/design-system'

export default function CompaniesPage() {
  return (
    <main className="min-h-screen bg-[#FAF6EF]">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-3">
        <div className="space-y-2">
          <p className={sectionHeader.eyebrow}>Expo Guide</p>
          <h1 className={sectionHeader.title}>Каталог экспонентов</h1>
        </div>

        <CompaniesList />
      </div>
    </main>
  )
}
