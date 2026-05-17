'use client'

import { useState } from 'react'
import Link from 'next/link'

import { cn, radius } from '@/lib/design-system'
import { onBannerClick, type Banner } from '@/lib/banners'

const aspectRatioByType: Record<Banner['type'], string> = {
  compact: 'aspect-[686/180]',
  standard: 'aspect-[686/260]',
  tall: 'aspect-[686/420]',
}

type Props = {
  banner: Banner
  className?: string
}

export default function BannerCard({ banner, className }: Props) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = banner.mobileImage || banner.image
  const isExternal = banner.url?.startsWith('http') ?? false
  const clickableClassName = 'block transition-opacity hover:opacity-90'
  const content = (
    <div
      className={cn(
        radius.cardRadius,
        'relative w-full overflow-hidden border border-[#7A3F1D]/15 bg-white shadow-sm',
        aspectRatioByType[banner.type],
        className
      )}
    >
      {!imageFailed ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={image}
          alt={banner.title}
          className="block h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col justify-center bg-[#FFF4E6] p-5">
          <p className="text-2xl font-bold leading-tight text-[#4A2412]">
            {banner.title}
          </p>
        </div>
      )}
    </div>
  )

  if (!banner.url) {
    return content
  }

  if (!isExternal) {
    return (
      <Link
        href={banner.url}
        className={clickableClassName}
        onClick={() => onBannerClick(banner)}
        aria-label={banner.title}
      >
        {content}
      </Link>
    )
  }

  return (
    <a
      href={banner.url}
      target="_blank"
      rel="noopener noreferrer"
      className={clickableClassName}
      onClick={() => onBannerClick(banner)}
      aria-label={banner.title}
    >
      {content}
    </a>
  )
}
