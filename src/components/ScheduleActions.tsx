'use client'

import { useCallback, useState } from 'react'
import { Share2, Star } from 'lucide-react'

import { borders, cn, radius } from '@/lib/design-system'
import { getFavoriteEventIds, toggleFavoriteEvent } from '@/lib/favorites'

type Props = {
  eventId: string
  eventTitle?: string
  eventUrl?: string
}

export default function ScheduleActions({
  eventId,
  eventTitle,
  eventUrl,
}: Props) {
  const [saved, setSaved] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return getFavoriteEventIds().includes(String(eventId))
  })

  const toggleSaved = useCallback(() => {
    toggleFavoriteEvent(eventId)
    setSaved(getFavoriteEventIds().includes(String(eventId)))
  }, [eventId])

  const shareEvent = useCallback(async () => {
    const baseUrl = window.location.origin
    const url = eventUrl
      ? new URL(eventUrl, baseUrl).toString()
      : window.location.href
    const title = eventTitle || 'Событие конференции'

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // ignore user cancel
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      window.alert('Ссылка скопирована')
    } catch {
      window.alert('Не удалось поделиться')
    }
  }, [eventTitle, eventUrl])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggleSaved}
        className={cn(
          'inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold transition-colors',
          radius.buttonRadius,
          saved
            ? 'border border-[#4A2412] bg-[#4A2412] text-white'
            : `${borders.borderDefault} bg-[#FFFDF8] text-[#4A2412] hover:bg-[#FAF6EF]`
        )}
      >
        <Star
          size={16}
          className={saved ? 'fill-white stroke-white' : 'stroke-[#8A654F]'}
        />
        <span>{saved ? 'В расписании' : 'В расписание'}</span>
      </button>

      <button
        type="button"
        onClick={shareEvent}
        className={cn(
          'inline-flex h-10 items-center gap-2 bg-[#FFFDF8] px-4 text-sm font-semibold text-[#4A2412] transition-colors hover:bg-[#FAF6EF]',
          radius.buttonRadius,
          borders.borderDefault
        )}
      >
        <Share2 size={16} className="stroke-[#8A654F]" />
        <span>Поделиться</span>
      </button>
    </div>
  )
}
