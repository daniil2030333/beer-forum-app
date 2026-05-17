import type { UserRole } from '@/lib/types/event'

export const userRoleStorageKey = 'beerforum-user-role'

export const userRoleLabels: Record<UserRole, string> = {
  visitor: 'Посетитель',
  participant: 'Участник',
}

export function parseUserRole(value: string | null): UserRole | null {
  if (value === 'visitor' || value === 'participant') {
    return value
  }

  return null
}
