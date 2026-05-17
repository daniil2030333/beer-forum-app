'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import program from '@/data/program.json'
import BannerCard from '@/components/ads/BannerCard'
import BrandMark from '@/components/BrandMark'
import FaqSection from '@/components/FaqSection'
import FeedbackSection from '@/components/FeedbackSection'
import RoleModePanel from '@/components/RoleModePanel'
import {
  normalizeProgramEvents,
  groupEventsByDay,
} from '@/lib/program'
import { filterProgramForRole } from '@/lib/program-visibility'
import { getForcedBanner } from '@/lib/banners'
import { getFavoriteEventIds, removeFavoriteEvent } from '@/lib/favorites'
import { useUserRole } from '@/lib/use-user-role'
import {
  borders,
  cardClassName,
  cn,
  radius,
  sectionHeader,
  surfaces,
  textColors,
} from '@/lib/design-system'
import type { Event } from '@/lib/types/event'

export default function MePage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const registrationBanner = getForcedBanner('me-top')
  const { role } = useUserRole()
  const currentRole = role || 'visitor'

  useEffect(() => {
    const id = window.setTimeout(() => {
      setFavoriteIds(getFavoriteEventIds())
    }, 0)

    return () => window.clearTimeout(id)
  }, [])

  const events = useMemo(
    () => normalizeProgramEvents(filterProgramForRole(program as Event[], currentRole)),
    [currentRole]
  )

  const favoriteEvents = useMemo(
    () => events.filter((event) => favoriteIds.includes(String(event.id))),
    [events, favoriteIds]
  )

  const groupedEvents = useMemo(
    () => groupEventsByDay(favoriteEvents),
    [favoriteEvents]
  )

  const handleRemove = (eventId: string) => {
    removeFavoriteEvent(eventId)
    setFavoriteIds(getFavoriteEventIds())
  }

  if (favoriteEvents.length === 0) {
    return (
      <main className="min-h-screen bg-[#FAF6EF] p-4 pb-24">
        <div className="mx-auto max-w-5xl space-y-4">
          <section className="flex items-center justify-between gap-3 pt-[env(safe-area-inset-top)]">
            <div className="min-w-0 space-y-1">
              <p className={sectionHeader.eyebrow}>
                Мое расписание
              </p>
              <h1 className="text-2xl font-semibold tracking-normal text-[#4A2412]">
                Избранные события
              </h1>
              <p className="text-sm leading-5 text-[#8A654F]">
                Ваш персональный раздел Форума
              </p>
            </div>
            <BrandMark className="h-14 w-14" />
          </section>

          <RoleModePanel />

          {registrationBanner && <BannerCard banner={registrationBanner} />}

          <div className={cn(cardClassName, 'space-y-4 p-5')}>
            <div className="text-center">
              <div className={cn(radius.badgeRadius, surfaces.surfaceSecondary, 'mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center')}>
                <span className="text-2xl">📋</span>
              </div>
              <h2 className="text-2xl font-bold text-[#4A2412]">Пока ничего</h2>
              <p className="mt-2 text-[#8A654F]">
                Вы пока не добавили события в расписание.
              </p>
              <p className="mt-1 text-sm text-[#8A654F]">
                Перейдите на страницу расписания и нажмите звездочку рядом с интересующим вас событием.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/program"
                className={cn('inline-flex h-11 flex-1 items-center justify-center bg-[#4A2412] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7A3F1D]', radius.buttonRadius)}
              >
                Открыть расписание
              </Link>
              <Link
                href="/speakers"
                className={cn('inline-flex h-11 flex-1 items-center justify-center bg-[#FFFDF8] px-4 text-sm font-semibold text-[#4A2412] transition-colors hover:bg-[#FAF6EF]', radius.buttonRadius, borders.borderDefault)}
              >
                Смотреть спикеров
              </Link>
            </div>
          </div>

          <FaqSection />
          <FeedbackSection />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF6EF] p-4 pb-24">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="flex items-center justify-between gap-3 pt-[env(safe-area-inset-top)]">
          <div className="min-w-0 space-y-1">
            <p className={sectionHeader.eyebrow}>
              Мое расписание
            </p>
            <h1 className="text-2xl font-semibold tracking-normal text-[#4A2412]">
              Избранные события
            </h1>
            <p className="text-sm leading-5 text-[#8A654F]">
              Ваш персональный раздел Форума
            </p>
            <p className="text-sm font-medium text-[#7A3F1D]">
              {favoriteEvents.length} событи{favoriteEvents.length % 10 === 1 && !String(favoriteEvents.length).endsWith('11') ? 'е' : favoriteEvents.length % 10 === 2 || favoriteEvents.length % 10 === 3 || favoriteEvents.length % 10 === 4 ? 'я' : 'й'} в вашем расписании.
            </p>
          </div>
          <BrandMark className="h-14 w-14" />
        </section>

        <RoleModePanel />

        {registrationBanner && <BannerCard banner={registrationBanner} />}

        <div className="space-y-4">
          {Object.entries(groupedEvents).map(([day, dayEvents]) => (
            <section key={day} className="space-y-4">
              <div className="sticky top-20 z-20 border-b border-[#7A3F1D]/15 bg-[#FAF6EF]/95 py-2 backdrop-blur-sm">
                <div className="mx-auto max-w-5xl px-0">
                  <h2 className="text-lg font-semibold text-[#4A2412]">{day}</h2>
                </div>
              </div>

              <div className="space-y-4">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      cardClassName,
                      'overflow-hidden p-4',
                      event.isLive && 'border-[#F7941D] bg-[#FFF4E6]'
                    )}
                  >
                    <div className="grid gap-4 lg:grid-cols-[5.5rem_minmax(0,1fr)]">
                      <div className="flex flex-col items-start gap-3">
                        <div className="mt-1 text-sm font-semibold text-[#8A654F]">
                          {event.timeLabel}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(String(event.id))}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 transition-colors hover:bg-red-100"
                          title="Удалить из расписания"
                        >
                          <X
                            size={18}
                            className="stroke-red-600"
                          />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start gap-2">
                          {event.isLive && (
                            <span className={cn(radius.badgeRadius, 'bg-rose-500 px-3 py-1 text-xs font-semibold text-white')}>
                              LIVE NOW
                            </span>
                          )}
                        </div>

                        <Link href={`/program/${event.id}`} className="block">
                          <div className="min-w-0">
                            <h3 className="break-words text-xl font-semibold leading-tight text-[#4A2412]">
                              {event.title}
                            </h3>
                            {event.description && (
                              <p className="mt-2 line-clamp-3 max-w-prose text-base text-[#8A654F]">
                                {event.description}
                              </p>
                            )}
                          </div>

                          <div className={cn('mt-2 flex items-center gap-2 text-sm', textColors.textMuted)}>
                            <span>{event.location || event.hall || 'Локация не указана'}</span>
                          </div>
                        </Link>

                        {(event.speakerNames || []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {event.speakerNames.slice(0, 4).map((speaker) => (
                              <span
                                key={`${event.id}-${speaker}`}
                                className={cn(radius.badgeRadius, surfaces.surfaceSecondary, 'px-2 py-1 text-xs font-medium text-[#5A321E]')}
                              >
                                {speaker}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <FaqSection />
        <FeedbackSection />
      </div>
    </main>
  )
}
