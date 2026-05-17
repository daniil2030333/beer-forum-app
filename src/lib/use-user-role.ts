'use client'

import { useCallback, useEffect, useState } from 'react'
import type { UserRole } from '@/lib/types/event'
import { parseUserRole, userRoleStorageKey } from '@/lib/user-role'

const userRoleChangeEvent = 'beerforum-user-role-change'

function readStoredRole() {
  return parseUserRole(window.localStorage.getItem(userRoleStorageKey))
}

export function useUserRole() {
  const [role, setRoleState] = useState<UserRole | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const syncRole = () => {
      const nextRole = readStoredRole()
      setRoleState(nextRole)
      setIsLoaded(true)

      if (process.env.NODE_ENV === 'development') {
        console.info('[role]', nextRole)
      }
    }

    syncRole()

    window.addEventListener('storage', syncRole)
    window.addEventListener(userRoleChangeEvent, syncRole)

    return () => {
      window.removeEventListener('storage', syncRole)
      window.removeEventListener(userRoleChangeEvent, syncRole)
    }
  }, [])

  const setRole = useCallback((nextRole: UserRole) => {
    window.localStorage.setItem(userRoleStorageKey, nextRole)
    window.dispatchEvent(new Event(userRoleChangeEvent))
  }, [])

  return {
    role,
    isLoaded,
    setRole,
  }
}
