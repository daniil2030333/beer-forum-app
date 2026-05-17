'use client'

import { cn, radius, surfaces } from '@/lib/design-system'
import type { UserRole } from '@/lib/types/event'
import { useUserRole } from '@/lib/use-user-role'
import { userRoleLabels } from '@/lib/user-role'

export default function RoleModePanel() {
  const { role, setRole } = useUserRole()
  const currentRole = role || 'visitor'
  const nextRole: UserRole = currentRole === 'visitor' ? 'participant' : 'visitor'

  return (
    <section className="mt-8 rounded-3xl border border-[#7A3F1D]/10 bg-[#FFFDF8]/65 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A654F]">
            Режим приложения
          </p>
          <p className="mt-2 text-sm text-[#8A654F]">Текущая роль:</p>
          <p className="mt-1 text-base font-semibold text-[#4A2412]">
            {userRoleLabels[currentRole]}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRole(nextRole)}
          className={cn(
            radius.buttonRadius,
            surfaces.surfaceSecondary,
            'h-10 border border-[#7A3F1D]/15 px-4 text-sm font-semibold text-[#5A321E] transition-colors hover:bg-[#FFE7C2]'
          )}
        >
          Сменить роль
        </button>
      </div>
    </section>
  )
}
