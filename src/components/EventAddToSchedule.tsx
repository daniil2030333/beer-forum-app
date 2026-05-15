'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { isFavoriteEvent, toggleFavoriteEvent, getFavoriteEventIds } from '@/lib/favorites'
import { borders, cn, radius } from '@/lib/design-system'

interface EventAddToScheduleProps {
  eventId: string
  eventTitle: string
}

export default function EventAddToSchedule({ eventId }: EventAddToScheduleProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setIsFavorite(isFavoriteEvent(eventId))
    }, 0)

    return () => window.clearTimeout(id)
  }, [eventId])

  const handleToggle = () => {
    toggleFavoriteEvent(eventId)
    setIsFavorite(getFavoriteEventIds().includes(eventId))
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2 px-4 text-sm font-semibold transition-colors',
        radius.buttonRadius,
        isFavorite
          ? 'bg-[#7A3F1D] text-white hover:bg-[#F7941D]'
          : `${borders.borderDefault} bg-[#FFFDF8] text-[#4A2412] hover:bg-[#FAF6EF]`
      )}
    >
      <Star
        size={18}
        className={isFavorite ? 'fill-current' : ''}
      />
      {isFavorite ? 'В моем расписании' : 'Добавить в расписание'}
    </button>
  )
}
