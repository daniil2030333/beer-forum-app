'use client'

import speakers from '@/data/speakers.json'
import Link from 'next/link'
import { useState } from 'react'

import SpeakerAvatar from '@/components/SpeakerAvatar'
import {
  getSpeakerHref,
  getSpeakerRouteId,
  type Speaker,
} from '@/lib/speakers'
import {
  cardClassName,
  cn,
  inputClassName,
  radius,
  surfaces,
  textColors,
} from '@/lib/design-system'

export default function SpeakersList() {
  const [search, setSearch] = useState('')

  const filtered = (speakers as Speaker[]).filter((speaker) =>
    `${speaker.name || ''} ${speaker.position || ''} ${speaker.company || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск спикеров..."
        className={cn(inputClassName, 'w-full outline-none')}
      />

      <div className="grid gap-2.5">
        {filtered.map((speaker, index) => (
          <Link
            key={getSpeakerRouteId(speaker) || index}
            href={getSpeakerHref(speaker)}
            className={cn(cardClassName, 'block p-3 transition-colors hover:bg-[#FAF6EF]')}
          >
            <div className="flex items-center gap-3">
              <SpeakerAvatar
                name={speaker.name}
                image={speaker.image}
                className="h-[72px] w-[72px]"
              />

              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="break-words text-lg font-semibold leading-tight text-[#4A2412]">
                  {speaker.name}
                </h3>

                {speaker.company && (
                  <div
                    className={cn(
                      radius.badgeRadius,
                      surfaces.surfaceSecondary,
                      'inline-flex max-w-full px-2 py-1 text-xs font-medium text-[#5A321E]'
                    )}
                  >
                    {speaker.company}
                  </div>
                )}

                {speaker.position && (
                  <p className={cn('line-clamp-2 break-words text-sm leading-[1.35]', textColors.textSecondary)}>
                    {speaker.position}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
