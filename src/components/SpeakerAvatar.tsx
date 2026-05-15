'use client'

import { useState } from 'react'

import { cn, radius, surfaces } from '@/lib/design-system'
import { getSpeakerInitials } from '@/lib/speakers'

type Props = {
  name?: string
  image?: string | null
  className?: string
  shape?: 'rounded' | 'circle'
}

export default function SpeakerAvatar({
  name,
  image,
  className = 'h-24 w-24',
  shape = 'rounded',
}: Props) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(image) && !failed

  return (
    <div
      className={cn(
        className,
        'flex shrink-0 items-center justify-center overflow-hidden text-lg font-bold text-[#A7795F]',
        shape === 'circle' ? radius.badgeRadius : radius.inputRadius,
        surfaces.surfaceSecondary
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name || 'Спикер'}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{getSpeakerInitials(name) || 'П'}</span>
      )}
    </div>
  )
}
