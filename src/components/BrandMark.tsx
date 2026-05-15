import { cn } from '@/lib/design-system'

type Props = {
  className?: string
}

export default function BrandMark({ className }: Props) {
  return (
    <div
      className={cn(
        'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden',
        className
      )}
      aria-label="Логотип Форума ПИВО-2026"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/forum-logo.svg"
        alt=""
        className="h-full w-full object-contain"
        aria-hidden="true"
      />
    </div>
  )
}
