'use client'

import { useSyncExternalStore } from 'react'
import { borders, cn, radius } from '@/lib/design-system'

type Props = {
  speakerId: string
}

const storageKey = 'beer-forum-favorite-speakers'
const favoriteChangeEvent = 'beer-forum-favorite-speakers-change'

function getFavorites() {
  const stored = localStorage.getItem(storageKey)

  try {
    return stored ? (JSON.parse(stored) as string[]) : []
  } catch {
    return []
  }
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(favoriteChangeEvent, callback)

  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(favoriteChangeEvent, callback)
  }
}

export default function FavoriteSpeakerButton({
  speakerId,
}: Props) {
  const isFavorite = useSyncExternalStore(
    subscribe,
    () => getFavorites().includes(speakerId),
    () => false
  )

  function toggleFavorite() {
    const favorites = getFavorites()
    const nextFavorites = favorites.includes(speakerId)
      ? favorites.filter((id) => id !== speakerId)
      : [...favorites, speakerId]

    localStorage.setItem(
      storageKey,
      JSON.stringify(nextFavorites)
    )
    window.dispatchEvent(new Event(favoriteChangeEvent))
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      className={cn(
        'mt-5 h-11 w-full bg-[#4A2412] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#7A3F1D]',
        radius.buttonRadius,
        borders.borderDefault
      )}
    >
      {isFavorite
        ? 'В избранном'
        : 'Добавить в избранное'}
    </button>
  )
}
