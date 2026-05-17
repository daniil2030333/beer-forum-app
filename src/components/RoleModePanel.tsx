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
    <section className={cn('rounded-3xl border border-[#7A3F1D]/15 bg-[#FFFDF8] p-5 shadow-sm')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7A3F1D]">
            Режим приложения
          </p>
          <p className="mt-3 text-sm text-[#8A654F]">Текущая роль:</p>
          <p className="mt-1 text-2xl font-bold text-[#4A2412]">
            {userRoleLabels[currentRole]}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRole(nextRole)}
          className={cn(
            radius.buttonRadius,
            surfaces.surfaceSecondary,
            'h-12 px-5 text-sm font-semibold text-[#4A2412] transition-colors hover:bg-[#FFE7C2]'
          )}
        >
          Сменить роль
        </button>
      </div>
    </section>
  )
}
