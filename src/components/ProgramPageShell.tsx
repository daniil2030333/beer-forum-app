import ProgramList from '@/components/ProgramList'
import BrandMark from '@/components/BrandMark'
import { radius } from '@/lib/design-system'

export default function ProgramPageShell() {
  return (
    <main className="min-h-screen bg-[#FAF6EF]">
      <header className="relative overflow-visible bg-[#FAF6EF] pb-0 pt-2">
        <div className="mx-auto max-w-xl px-4">
          <div className="h-auto rounded-3xl border border-[#7A3F1D]/15 bg-[#FFFDF8] p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <BrandMark className="h-[84px] w-[84px] shrink-0 transition-all duration-200" />

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase leading-[1.35] tracking-[0.12em] text-[#7A3F1D]">
                  XXXV Юбилейный Международный Форум
                </p>
                <h1 className="mt-1.5 text-3xl font-bold leading-tight tracking-normal text-[#4A2412]">
                  ПИВО-2026
                </h1>
                <p className="mt-1.5 text-sm font-medium leading-5 text-[#7A3F1D]">
                  19–21 мая · Сочи · Гранд отель “Жемчужина”
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-0.5 flex-1 rounded-full bg-[#F7941D]" />
              <div className={`${radius.badgeRadius} bg-[#7A3F1D] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#FFFDF8]`}>
                Мобильный гид
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-xl px-4 pb-3 pt-4">
        <ProgramList />
      </section>
    </main>
  )
}
