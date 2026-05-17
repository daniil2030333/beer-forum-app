import CompaniesList from '@/components/CompaniesList'
import ForumLightLogo from '@/components/ForumLightLogo'
import { sectionHeader } from '@/lib/design-system'

export default function CompaniesPage() {
  return (
    <main className="min-h-screen bg-[#FAF6EF]">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3 pt-[env(safe-area-inset-top)]">
          <div className="min-w-0 space-y-1">
            <p className={sectionHeader.eyebrow}>Expo Guide</p>
            <h1 className="text-2xl font-semibold tracking-normal text-[#4A2412]">
              Каталог экспонентов
            </h1>
            <p className="text-sm leading-5 text-[#8A654F]">
              Каталог участников и экспонентов Форума
            </p>
          </div>
          <ForumLightLogo />
        </div>

        <CompaniesList />
      </div>
    </main>
  )
}
