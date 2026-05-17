import Link from 'next/link'

import program from '@/data/program.json'
import EventDetailClient from '@/components/EventDetailClient'
import { getEventById } from '@/lib/program'
import { borders, cardClassName, cn, radius } from '@/lib/design-system'
import type { Event } from '@/lib/types/event'

type Props = {
  params: Promise<{
    id: string
  }>
}

export function generateStaticParams() {
  return (program as Event[]).map((event) => ({
    id: String(event.id),
  }))
}

export default async function EventPage({
  params,
}: Props) {
  const { id } = await params

  const event = getEventById(program as Event[], id)

  if (!event) {
    return (
      <main className="min-h-screen bg-[#FAF6EF] p-4 pb-28">
        <div className={cn(cardClassName, 'mx-auto max-w-3xl p-5')}>
          <p className="text-base text-[#8A654F]">Событие не найдено.</p>
          <Link
            href="/program"
            className={cn('mt-4 inline-flex h-11 items-center bg-[#FFFDF8] px-4 text-sm font-semibold text-[#7A3F1D] shadow-sm', radius.buttonRadius, borders.borderDefault)}
          >
            Вернуться к расписанию
          </Link>
        </div>
      </main>
    )
  }

  return <EventDetailClient event={event} />
}
