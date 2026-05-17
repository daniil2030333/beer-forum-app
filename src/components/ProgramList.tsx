'use client'

import { useEffect, useMemo, useState } from 'react'
import { Fragment } from 'react'
import Link from 'next/link'
import program from '@/data/program.json'
import speakers from '@/data/speakers.json'
import BannerCard from '@/components/ads/BannerCard'
import ScheduleActions from '@/components/ScheduleActions'
import SpeakerAvatar from '@/components/SpeakerAvatar'
import { getBannerForIndex, getTopBanner } from '@/lib/banners'
import {
  groupEventsByDay,
  normalizeProgramEvents,
} from '@/lib/program'
import { filterProgramForRole } from '@/lib/program-visibility'
import { findSpeakerByName, type Speaker } from '@/lib/speakers'
import { useUserRole } from '@/lib/use-user-role'
import {
  borders,
  cardClassName,
  cn,
  radius,
  surfaces,
} from '@/lib/design-system'
import type { Event } from '@/lib/types/event'
import type { ProgramEventType } from '@/lib/types/event'

const nativeControlClassName =
  'h-11 w-full rounded-2xl border border-[#7A3F1D]/15 bg-[#FFFDF8] px-4 text-base font-medium text-[#8A654F] shadow-sm'

function eventTypeBadgeClassName(eventType: ProgramEventType) {
  return cn(
    radius.badgeRadius,
    'border px-2 py-1 text-sm font-medium',
    eventType === 'требуется приглашение'
      ? 'border-[#7A3F1D] bg-[#7A3F1D] text-white'
      : 'border-[#F7941D]/30 bg-[#FFF4E6] text-[#7A3F1D]'
  )
}

function SpeakerAvatarStack({
  speakerNames,
}: {
  speakerNames: string[]
}) {
  const visibleSpeakers = speakerNames.slice(0, 3).map((speakerName) => {
    const speaker = findSpeakerByName(speakers as Speaker[], speakerName)

    return {
      name: speaker?.name || speakerName,
      image: speaker?.image,
    }
  })
  const extraCount = Math.max(0, speakerNames.length - visibleSpeakers.length)

  if (visibleSpeakers.length === 0) {
    return null
  }

  return (
    <div className="flex items-center">
      {visibleSpeakers.map((speaker, index) => (
        <SpeakerAvatar
          key={`${speaker.name}-${index}`}
          name={speaker.name}
          image={speaker.image}
          shape="circle"
          className={cn(
            'h-8 w-8 border-2 border-[#FFFDF8] text-[10px] shadow-sm',
            index > 0 && '-ml-2'
          )}
        />
      ))}
      {extraCount > 0 && (
        <div
          className={cn(
            '-ml-2 flex h-8 w-8 items-center justify-center border-2 border-[#FFFDF8] bg-[#FFF4E6] text-[10px] font-semibold text-[#5A321E] shadow-sm',
            radius.badgeRadius
          )}
        >
          +{extraCount}
        </div>
      )}
    </div>
  )
}

export default function ProgramList() {
  const [filters, setFilters] = useState({
    role: 'visitor',
    activeDay: '',
    activeLocation: '',
  })
  const { role } = useUserRole()
  const currentRole = role || 'visitor'
  const activeDay = filters.role === currentRole ? filters.activeDay : ''
  const requestedLocation = filters.role === currentRole ? filters.activeLocation : ''

  const visibleProgram = useMemo(
    () => filterProgramForRole(program as Event[], currentRole),
    [currentRole]
  )

  const events = useMemo(
    () => normalizeProgramEvents(visibleProgram),
    [visibleProgram]
  )

  const hiddenCount = (program as Event[]).length - visibleProgram.length

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.info('[program:filtered]', hiddenCount)
    }
  }, [hiddenCount])

  const locationList = useMemo(() => {
    return Array.from(
      new Set(
        events
          .map((event) => event.location || event.hall || '')
          .filter(Boolean)
      )
    )
  }, [events])

  const activeLocation = requestedLocation && locationList.includes(requestedLocation)
    ? requestedLocation
    : ''

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (activeDay && event.normalizedDay !== activeDay) {
        return false
      }

      const location = event.location || event.hall || ''
      if (activeLocation && location !== activeLocation) {
        return false
      }

      return true
    })
  }, [activeDay, activeLocation, events])

  const groupedEvents = useMemo(
    () => groupEventsByDay(filteredEvents),
    [filteredEvents]
  )

  const dayList = useMemo(() => Object.keys(groupEventsByDay(events)), [events])

  const visibleGroups = useMemo(
    () => Object.entries(groupedEvents),
    [groupedEvents]
  )
  const topBanner = getTopBanner('program-top')
  const programBanners = useMemo(() => {
    const bannerMap = new Map<number, NonNullable<ReturnType<typeof getBannerForIndex>>>()
    let previousBannerId = topBanner?.id ?? null
    let globalIndex = 0

    for (const [, dayEvents] of visibleGroups) {
      for (let dayEventIndex = 0; dayEventIndex < dayEvents.length; dayEventIndex += 1) {
        const banner = getBannerForIndex(
          'program-feed',
          globalIndex,
          previousBannerId ? [previousBannerId] : []
        )

        if (banner) {
          bannerMap.set(globalIndex, banner)
          previousBannerId = banner.id
        }

        globalIndex += 1
      }
    }

    return bannerMap
  }, [topBanner?.id, visibleGroups])

  return (
    <div className="space-y-4">
      <section data-program-filter className="sticky top-[env(safe-area-inset-top)] z-40">
        <div className={cn(radius.inputRadius, borders.borderDefault, surfaces.surfacePrimary, 'p-3 shadow-sm')}>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="sr-only">День программы</span>
              <select
                value={activeDay}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    role: currentRole,
                    activeDay: event.target.value,
                  }))
                }
                className={nativeControlClassName}
              >
                <option value="">Все дни</option>
                {dayList.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Место проведения</span>
              <select
                value={activeLocation}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    role: currentRole,
                    activeLocation: event.target.value,
                  }))
                }
                className={nativeControlClassName}
              >
                <option value="">Все места</option>
                {locationList.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>
          </div>

        </div>
      </section>

      {topBanner && <BannerCard banner={topBanner} />}

      {visibleGroups.length === 0 ? (
        <div className={cn(cardClassName, 'p-4 text-center text-sm text-[#8A654F]')}>
          Нет событий на выбранную дату.
        </div>
      ) : (
        <div className="space-y-5">
          {visibleGroups.map(([day, dayEvents]) => (
              <section key={day} className="space-y-4">
                <div className="py-1">
                  <div className="mx-auto max-w-5xl px-0">
                    <h2 className="text-lg font-semibold text-[#4A2412]">{day}</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {dayEvents.map((event, eventIndex) => {
                    const speakerNames = event.speakerNames || []
                    const globalIndex =
                      visibleGroups
                        .slice(0, visibleGroups.findIndex(([groupDay]) => groupDay === day))
                        .reduce((total, [, groupEvents]) => total + groupEvents.length, 0) +
                      eventIndex
                    const banner = programBanners.get(globalIndex)

                    return (
                      <Fragment key={event.id}>
                        <div
                          className={cn(
                            cardClassName,
                            'overflow-hidden p-3',
                            event.isLive && 'border-[#F7941D] bg-[#FFF4E6]'
                          )}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                              <span className={cn(radius.badgeRadius, 'shrink-0 bg-[#F7941D] px-2 py-1 text-sm font-semibold text-[#4A2412]')}>
                                {event.timeLabel}
                              </span>
                              {event.eventType && (
                                <span className={eventTypeBadgeClassName(event.eventType)}>
                                  {event.eventType}
                                </span>
                              )}
                              {event.isLive && (
                                <span
                                  className={cn(
                                    radius.badgeRadius,
                                    'bg-rose-500 px-2 py-1 text-xs font-semibold text-white'
                                  )}
                                >
                                  LIVE
                                </span>
                              )}
                            </div>

                            <Link href={`/program/${event.id}`} className="block">
                              <div className="min-w-0">
                                <h3 className="line-clamp-2 break-words text-xl font-semibold leading-tight text-[#4A2412]">
                                  {event.title}
                                </h3>
                                {event.subtitle && (
                                  <p className="mt-1 text-sm font-medium leading-5 text-[#7A3F1D]">
                                    {event.subtitle}
                                  </p>
                                )}
                                {event.description && (
                                  <p className="mt-1.5 line-clamp-2 max-w-prose text-sm leading-5 text-[#8A654F]">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </Link>

                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <span
                                  className={cn(
                                    radius.badgeRadius,
                                    'inline-flex max-w-full bg-[#FFF4E6] px-3 py-1 text-sm font-medium text-[#5A321E]'
                                  )}
                                >
                                  <span className="truncate">
                                    {event.location || event.hall || 'Локация не указана'}
                                  </span>
                                </span>
                              </div>
                              {speakerNames.length > 0 && (
                                <SpeakerAvatarStack speakerNames={speakerNames} />
                              )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <ScheduleActions
                                eventId={event.id}
                                eventTitle={event.title}
                                eventUrl={`/program/${event.id}`}
                              />
                            </div>
                          </div>
                        </div>
                        {banner && (
                          <div key={`banner-program-${globalIndex}`} className="mb-2 mt-4">
                            <BannerCard banner={banner} />
                          </div>
                        )}
                      </Fragment>
                    )
                  })}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  )
}
