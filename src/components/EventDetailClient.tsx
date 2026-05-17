'use client'

import Link from 'next/link'

import program from '@/data/program.json'
import speakers from '@/data/speakers.json'
import ScheduleActions from '@/components/ScheduleActions'
import SpeakerAvatar from '@/components/SpeakerAvatar'
import { getRelatedEvents } from '@/lib/program'
import { filterProgramForRole, isEventVisibleForRole } from '@/lib/program-visibility'
import {
  findSpeakerByName,
  getSpeakerHref,
  type Speaker,
} from '@/lib/speakers'
import { useUserRole } from '@/lib/use-user-role'
import {
  borders,
  cardClassName,
  cn,
  radius,
  surfaces,
} from '@/lib/design-system'
import type { Event, ProgramEventType } from '@/lib/types/event'
import type { NormalizedEvent } from '@/lib/program'

function eventTypeBadgeClassName(eventType: ProgramEventType) {
  return cn(
    radius.badgeRadius,
    'border px-3 py-1 text-sm font-medium',
    eventType === 'требуется приглашение'
      ? 'border-[#7A3F1D] bg-[#7A3F1D] text-white'
      : 'border-[#F7941D]/30 bg-[#FFF4E6] text-[#7A3F1D]'
  )
}

export default function EventDetailClient({
  event,
}: {
  event: NormalizedEvent
}) {
  const { role, setRole } = useUserRole()
  const currentRole = role || 'visitor'
  const isVisible = isEventVisibleForRole(event, currentRole)

  if (!isVisible) {
    return (
      <main className="min-h-screen bg-[#FAF6EF] p-4 pb-28">
        <section className={cn(cardClassName, 'mx-auto max-w-3xl p-5 text-center')}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7A3F1D]">
            Закрытая программа
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-[#4A2412]">
            Событие доступно только участникам Форума.
          </h1>
          <button
            type="button"
            onClick={() => setRole('participant')}
            className={cn(
              'mt-5 inline-flex h-12 items-center justify-center bg-[#4A2412] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#7A3F1D]',
              radius.buttonRadius
            )}
          >
            Переключиться в режим участника
          </button>
          <div className="mt-3">
            <Link href="/program" className="text-sm font-semibold text-[#7A3F1D]">
              Назад к программе
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const eventSpeakers: Speaker[] = (event.speakers || [])
    .map((speakerName) => {
      const matched = findSpeakerByName(
        speakers as Speaker[],
        speakerName
      )

      return matched || { name: speakerName, image: null }
    })
    .filter((speaker) => speaker?.name)

  const relatedEvents = filterProgramForRole(
    getRelatedEvents(program as Event[], event),
    currentRole
  )
  const location = event.location || event.hall || 'Место проведения не указано'
  const dateTimeLabel = `${event.normalizedDay} · ${event.timeLabel}`

  return (
    <main className="min-h-screen bg-[#FAF6EF] pb-28">
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/program"
            className={cn('inline-flex h-10 items-center bg-[#FFFDF8] px-4 text-sm font-semibold text-[#7A3F1D] shadow-sm transition-colors hover:bg-[#FAF6EF]', radius.buttonRadius, borders.borderDefault)}
          >
            ← Назад к расписанию
          </Link>
        </div>

        <section className={cn(cardClassName, 'p-4')}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(radius.badgeRadius, 'bg-[#F7941D] px-3 py-1 text-sm font-semibold text-[#4A2412]')}>
              {dateTimeLabel}
            </span>
            {event.eventType && (
              <span className={eventTypeBadgeClassName(event.eventType)}>
                {event.eventType}
              </span>
            )}
            {event.isLive && (
              <span className={cn(radius.badgeRadius, 'bg-rose-500 px-3 py-1 text-xs font-semibold text-white')}>
                LIVE NOW
              </span>
            )}
          </div>

          <h1 className="mt-3 break-words text-2xl font-bold leading-tight tracking-tight text-[#4A2412]">
            {event.title}
          </h1>
          {event.subtitle && (
            <p className="mt-2 break-words text-base font-medium leading-6 text-[#7A3F1D]">
              {event.subtitle}
            </p>
          )}
        </section>

        <section className={cn(cardClassName, 'p-4')}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#A7795F]">
            Место проведения
          </h2>
          <p className="mt-2 break-words text-base font-semibold leading-6 text-[#4A2412]">
            {location}
          </p>
        </section>

        {event.description && (
          <section className={cn(cardClassName, 'p-4')}>
            <h2 className="text-xl font-semibold leading-tight text-[#4A2412]">
              О событии
            </h2>
            <p className="mt-3 whitespace-pre-line break-words text-base leading-relaxed text-[#8A654F]">
              {event.description}
            </p>
          </section>
        )}

        {eventSpeakers.length > 0 && (
          <section className={cn(cardClassName, 'p-4')}>
            <h2 className="text-xl font-semibold leading-tight text-[#4A2412]">
              Спикеры
            </h2>
            <div className="mt-3 space-y-3">
              {eventSpeakers.map((speaker) => (
                <Link
                  key={speaker.name}
                  href={getSpeakerHref(speaker)}
                  className={cn(
                    radius.inputRadius,
                    borders.borderDefault,
                    surfaces.surfaceSecondary,
                    'flex items-center gap-3 p-3 transition-colors hover:bg-[#FFF4E6]'
                  )}
                >
                  <SpeakerAvatar
                    name={speaker.name}
                    image={speaker.image}
                    shape="circle"
                    className="h-12 w-12 text-sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[#4A2412]">
                      {speaker.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-[#8A654F]">
                      {[speaker.position, speaker.company].filter(Boolean).join(' · ') || 'Спикер'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={cn(cardClassName, 'p-4')}>
          <h2 className="text-xl font-semibold leading-tight text-[#4A2412]">
            Действия
          </h2>
          <div className="mt-3">
            <ScheduleActions
              eventId={event.id}
              eventTitle={event.title}
              eventUrl={`/program/${event.id}`}
            />
          </div>
        </section>

        {relatedEvents.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold leading-tight text-[#4A2412]">Похожие события</h2>
              <span className="text-sm text-[#8A654F]">{relatedEvents.length} события</span>
            </div>

            <div className="grid gap-3">
              {relatedEvents.map((item) => (
                <Link
                  key={item.id}
                  href={`/program/${item.id}`}
                  className={cn(cardClassName, 'block p-3 transition-colors hover:bg-[#FAF6EF]')}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-semibold text-[#7A3F1D]">
                          {item.normalizedDay} · {item.timeLabel}
                        </span>
                      </div>
                      <h3 className="mt-2 break-words text-lg font-semibold leading-tight text-[#4A2412]">
                        {item.title}
                      </h3>
                    </div>
                    <span className={cn(radius.badgeRadius, 'shrink-0 bg-[#4A2412] px-3 py-1 text-sm font-semibold text-white')}>
                      {item.location || item.hall || 'Локация'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
