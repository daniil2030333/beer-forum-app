'use client'

import { useRouter } from 'next/navigation'
import BrandMark from '@/components/BrandMark'
import { cn, radius } from '@/lib/design-system'
import type { UserRole } from '@/lib/types/event'
import { useUserRole } from '@/lib/use-user-role'

export default function UserRoleGate({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { role, isLoaded, setRole } = useUserRole()

  const chooseRole = (nextRole: UserRole) => {
    setRole(nextRole)
    router.replace('/program')
  }

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#FAF6EF]" />
  }

  if (!role) {
    return (
      <main className="flex min-h-screen items-center bg-[#FAF6EF] p-4">
        <section className="mx-auto w-full max-w-xl rounded-3xl border border-[#7A3F1D]/15 bg-[#FFFDF8] p-6 shadow-sm">
          <div className="flex justify-center">
            <BrandMark className="h-28 w-28" />
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7A3F1D]">
              ПИВО-2026
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-[#4A2412]">
              Добро пожаловать на Форум ПИВО-2026
            </h1>
            <p className="mt-3 text-base leading-6 text-[#8A654F]">
              Выберите режим приложения, чтобы программа открылась в подходящем формате.
            </p>
          </div>

          <div className="mt-7 grid gap-3">
            <button
              type="button"
              onClick={() => chooseRole('visitor')}
              className={cn(
                'h-14 bg-[#4A2412] px-5 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-[#7A3F1D]',
                radius.buttonRadius
              )}
            >
              Я посетитель
            </button>
            <button
              type="button"
              onClick={() => chooseRole('participant')}
              className={cn(
                'h-14 border border-[#F7941D]/40 bg-[#FFF4E6] px-5 text-lg font-semibold text-[#4A2412] shadow-sm transition-colors hover:bg-[#FFE7C2]',
                radius.buttonRadius
              )}
            >
              Я участник
            </button>
          </div>
        </section>
      </main>
    )
  }

  return children
}
