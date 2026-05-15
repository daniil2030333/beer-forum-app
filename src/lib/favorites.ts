const STORAGE_KEY = 'favoriteEvents'

export function getFavoriteEventIds(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function isFavoriteEvent(eventId: string): boolean {
  return getFavoriteEventIds().includes(String(eventId))
}

export function toggleFavoriteEvent(eventId: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const ids = getFavoriteEventIds()
    const eventIdStr = String(eventId)
    const index = ids.indexOf(eventIdStr)

    if (index > -1) {
      ids.splice(index, 1)
    } else {
      ids.push(eventIdStr)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    return !ids.includes(eventIdStr)
  } catch {
    return false
  }
}

export function addFavoriteEvent(eventId: string): void {
  if (!isFavoriteEvent(eventId)) {
    toggleFavoriteEvent(eventId)
  }
}

export function removeFavoriteEvent(eventId: string): void {
  if (isFavoriteEvent(eventId)) {
    toggleFavoriteEvent(eventId)
  }
}

export function clearFavoriteEvents(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silent fail
  }
}
