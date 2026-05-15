import Link from 'next/link'

import program from '@/data/program.json'
import speakers from '@/data/speakers.json'
import FavoriteSpeakerButton from '@/components/FavoriteSpeakerButton'
import SpeakerAvatar from '@/components/SpeakerAvatar'
import {
  findSpeakerByName,
  getSpeakerRouteId,
  normalizeSpeakerName,
} from '@/lib/speakers'
import {
  borders,
  cardClassName,
  cn,
  radius,
  surfaces,
} from '@/lib/design-system'
import type { Event } from '@/lib/types/event'
import type { Speaker } from '@/lib/types/speaker'

type Props = {
  params: Promise<{
    id: string
  }>
}

function getSpeakerDescription(speaker: Speaker) {
  return (
    speaker.fullDescription ||
    speaker.bio ||
    speaker.about ||
    speaker.description ||
    ''
  ).trim()
}

function getSpeakerEvents(speaker: Speaker) {
  const speakerName = normalizeSpeakerName(speaker.name || '')

  if (!speakerName) {
    return []
  }

  return (program as Event[]).filter((event) =>
    (event.speakers || []).some(
      (eventSpeaker) =>
        normalizeSpeakerName(eventSpeaker) === speakerName
    )
  )
}

export function generateStaticParams() {
  return (speakers as Speaker[])
    .map((speaker) => getSpeakerRouteId(speaker))
    .filter(Boolean)
    .map((id) => ({ id }))
}

export default async function SpeakerPage({
  params,
}: Props) {
  const { id } = await params

  const speaker = findSpeakerByName(speakers as Speaker[], id)

  if (!speaker) {
    return (
      <main className="min-h-screen bg-[#FAF6EF] p-4">
        <div className={cn(cardClassName, 'mx-auto max-w-xl p-5')}>
          <p className="font-semibold">Спикер не найден</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold text-[#7A3F1D]"
          >
            Назад
          </Link>
        </div>
      </main>
    )
  }

  const description = getSpeakerDescription(speaker)
  const speakerEvents = getSpeakerEvents(speaker)
  const routeId = getSpeakerRouteId(speaker)
  const location = [speaker.city, speaker.country]
    .filter(Boolean)
    .join(', ')

  return (
    <main className="min-h-screen bg-[#FAF6EF] pb-24">
      <div className="sticky top-0 z-50 border-b border-[#7A3F1D]/15 bg-[#FAF6EF]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className={cn('inline-flex h-10 items-center bg-[#FFFDF8] px-4 text-sm font-semibold text-[#7A3F1D] shadow-sm', radius.buttonRadius, borders.borderDefault)}
          >
            Назад
          </Link>

          <div className="min-w-0 px-3 text-center text-sm font-semibold text-[#8A654F]">
            Спикер
          </div>

          <div className="w-[74px]" />
        </div>
      </div>

      <div className="mx-auto grid max-w-xl gap-4 p-4">
        <section className={cn(cardClassName, 'p-5 text-center')}>
          <div className="flex justify-center">
            <SpeakerAvatar
              name={speaker.name}
              image={speaker.image}
              className="h-40 w-40 sm:h-44 sm:w-44"
            />
          </div>

          <h1 className="mt-4 break-words text-4xl font-bold leading-tight tracking-tight text-[#4A2412]">
            {speaker.name}
          </h1>

          {speaker.position && (
            <p className="mt-3 break-words text-lg leading-relaxed text-[#8A654F]">
              {speaker.position}
            </p>
          )}

          {speaker.company && (
            <div className={cn(radius.badgeRadius, surfaces.surfaceSecondary, 'mt-4 inline-flex max-w-full px-3 py-1 text-sm font-medium text-[#5A321E]')}>
              <span className="truncate">
                {speaker.company}
              </span>
            </div>
          )}

          {location && (
            <p className="mt-3 text-sm font-medium text-[#A7795F]">
              {location}
            </p>
          )}

          <FavoriteSpeakerButton speakerId={routeId} />
        </section>

        {description && (
          <section className={cn(cardClassName, 'p-4')}>
            <h2 className="text-xl font-semibold leading-tight text-[#4A2412]">
              О спикере
            </h2>

            <p className="mt-3 whitespace-pre-line break-words text-base leading-relaxed text-[#8A654F]">
              {description}
            </p>
          </section>
        )}

        {speakerEvents.length > 0 && (
          <section>
            <h2 className="px-1 text-xl font-semibold leading-tight text-[#4A2412]">
              Выступления
            </h2>

            <div className="mt-3 grid gap-3">
              {speakerEvents.map((event) => (
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
        )}
      </div>
    </main>
  )
}
