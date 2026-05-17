'use client'

import Link from 'next/link'
import { filterProgramForRole } from '@/lib/program-visibility'
import { useUserRole } from '@/lib/use-user-role'
import { cardClassName, cn, radius, surfaces } from '@/lib/design-system'
import type { Event } from '@/lib/types/event'

export default function SpeakerEventsList({
  events,
}: {
  events: Event[]
}) {
  const { role } = useUserRole()
  const currentRole = role || 'visitor'
  const visibleEvents = filterProgramForRole(events, currentRole)

  if (visibleEvents.length === 0) {
    return null
  }

  return (
    <section>
      <h2 className="px-1 text-xl font-semibold leading-tight text-[#4A2412]">
        Выступления
      </h2>

      <div className="mt-3 grid gap-3">
        {visibleEvents.map((event) => (
          <Link
            key={event.id}
            href={`/program/${event.id}`}
            className={cn(cardClassName, 'block p-4 transition-colors hover:bg-[#FAF6EF]')}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  {event.time && (
                    <span className={cn(radius.badgeRadius, 'bg-[#7A3F1D] px-3 py-1 text-xs font-semibold text-white')}>
                      {event.time}
                    </span>
                  )}

                  {(event.day || event.date) && (
                    <span className={cn(radius.badgeRadius, surfaces.surfaceSecondary, 'px-3 py-1 text-xs font-medium text-[#5A321E]')}>
                      {event.day || event.date}
                    </span>
                  )}
                </div>

                <h3 className="mt-3 break-words text-lg font-semibold leading-tight text-[#4A2412]">
                  {event.title}
                </h3>

                {(event.location || event.hall) && (
                  <p className="mt-2 break-words text-sm leading-6 text-[#8A654F]">
                    {event.location || event.hall}
                  </p>
                )}
              </div>

              <span className={cn(radius.badgeRadius, surfaces.surfaceSecondary, 'mt-1 flex h-9 w-9 shrink-0 items-center justify-center text-lg font-semibold text-[#5A321E]')}>
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
