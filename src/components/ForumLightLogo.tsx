import Image from 'next/image'

type Props = {
  compact?: boolean
}

export default function ForumLightLogo({
  compact = false,
}: Props) {
  void compact

  return (
    <Image
      src="/branding/forum-light-logo.svg"
      alt="ПИВО-2026"
      width={49}
      height={44}
      loading="lazy"
      className="h-11 w-auto shrink-0 object-contain"
    />
  )
}
