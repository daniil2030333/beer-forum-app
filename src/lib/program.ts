import type { Event } from '@/lib/types/event'

const months: Record<string, number> = {
  янв: 0,
  фев: 1,
  мар: 2,
  апр: 3,
  май: 4,
  мая: 4,
  июн: 5,
  июл: 6,
  авг: 7,
  сен: 8,
  окт: 9,
  ноя: 10,
  дек: 11,
}

export type NormalizedEvent = Event & {
  normalizedDay: string
  timeLabel: string
  startTime?: string
  endTime?: string
  sortIndex: number
  dayOrder: number
  isLive: boolean
  speakerNames: string[]
  searchableText: string
}

function normalizeText(value?: string) {
  return value?.trim() || ''
}

function normalizeForCompare(value?: string) {
  return normalizeText(value)
    .replace(/[«»“”]/g, '"')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function getDisplayDescription(event: Pick<Event, 'title' | 'description'>) {
  const description = normalizeText(event.description)
  const title = normalizeText(event.title)

  if (!description || !title) {
    return description
  }

  const normalizedDescription = normalizeForCompare(description)
  const normalizedTitle = normalizeForCompare(title)

  if (normalizedDescription === normalizedTitle) {
    return ''
  }

  if (normalizedDescription.startsWith(normalizedTitle)) {
    return description.slice(title.length).replace(/^[\s.:;\-–—]+/, '').trim()
  }

  return description
}

function parseTimeRange(value?: string) {
  const raw = normalizeText(value).replace(/\s+/g, ' ')
  const cleaned = raw.replace(/\n/g, ' ').trim()
  const match = cleaned.match(/(\d{1,2})[.:](\d{2})(?:\s*-\s*(\d{1,2})[.:](\d{2}))?/) 
  if (!match) {
    return {
      label: cleaned || '—',
      start: undefined,
      end: undefined,
    }
  }

  const [, sh, sm, eh, em] = match
  const start = `${sh.padStart(2, '0')}:${sm}`
  const end = eh
    ? `${eh.padStart(2, '0')}:${em}`
    : addMinutes(start, 30)

  return {
    label: cleaned,
    start,
    end,
  }
}

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(':').map(Number)
  const date = new Date(0, 0, 0, hour, minute + minutes)
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`
}

function getDayDate(day: string, now: Date) {
  const raw = normalizeText(day)
  const match = raw.match(/(\d{1,2})\s+([а-яё]+)/i)
  if (!match) {
    return undefined
  }

  const [, dayNum, monthRaw] = match
  const monthKey = monthRaw.toLowerCase().slice(0, 3)
  const month = months[monthKey]

  if (month == null) {
    return undefined
  }

  const year = now.getFullYear()
  return new Date(year, month, Number(dayNum))
}

function getLiveStatus(event: Event, now: Date) {
  const { start, end } = parseTimeRange(event.time)
  const day = event.day || event.date || ''
  const eventDate = getDayDate(day, now)

  if (!start || !end || !eventDate) {
    return false
  }

  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)

  const startDate = new Date(eventDate)
  startDate.setHours(sh, sm, 0, 0)

  const endDate = new Date(eventDate)
  endDate.setHours(eh, em, 0, 0)

  return now >= startDate && now <= endDate
}

export function normalizeProgramEvents(
  events: Event[],
  options?: { now?: Date }
): NormalizedEvent[] {
  const now = options?.now ?? new Date()

  return events
    .map((event) => {
      const dayLabel = normalizeText(event.day || event.date || 'Программа')
      const { label: timeLabel, start, end } = parseTimeRange(event.time)
      const speakerNames = (event.speakers || []).map(normalizeText).filter(Boolean)
      const displayDescription = getDisplayDescription(event)
      const searchableText = [
        event.title,
        event.subtitle,
        displayDescription,
        event.location,
        event.hall,
        dayLabel,
        timeLabel,
        ...speakerNames,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const parsedDay = getDayDate(dayLabel, now)

      return {
        ...event,
        normalizedDay: dayLabel,
        timeLabel: timeLabel || 'Точно время',
        startTime: start,
        endTime: end,
        description: displayDescription,
        sortIndex: start ? Number(start.replace(':', '')) : 9999,
        dayOrder: parsedDay ? parsedDay.getTime() : 0,
        isLive: getLiveStatus(event, now),
        speakerNames,
        searchableText,
      }
    })
    .sort((a, b) => {
      if (a.dayOrder !== b.dayOrder) {
        return a.dayOrder - b.dayOrder
      }

      return a.sortIndex - b.sortIndex
    })
}

export function groupEventsByDay(events: NormalizedEvent[]) {
  return events.reduce((groups, event) => {
    const day = event.normalizedDay || 'Программа'

    if (!groups[day]) {
      groups[day] = []
    }

    groups[day].push(event)
    return groups
  }, {} as Record<string, NormalizedEvent[]>)
}

export function getEventById(events: Event[], id: string, options?: { now?: Date }) {
  return normalizeProgramEvents(events, options).find((event) => String(event.id) === id)
}

export function getRelatedEvents(
  events: Event[],
  current: NormalizedEvent,
  count = 3
) {
  const normalized = normalizeProgramEvents(events)
  return normalized
    .filter((event) => event.id !== current.id)
    .filter(
      (event) =>
        event.normalizedDay === current.normalizedDay ||
        normalizeText(event.location || event.hall) ===
          normalizeText(current.location || current.hall)
    )
    .slice(0, count)
}
