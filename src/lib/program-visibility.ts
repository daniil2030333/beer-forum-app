import type { Event, UserRole } from '@/lib/types/event'

const hiddenTextMarkers = [
  'монтаж',
  'демонтаж',
  'заезд',
  'выезд',
  'служебное',
  'подготовка',
]

function normalize(value?: string | null) {
  return (value || '').toLocaleLowerCase('ru-RU')
}

function hasServiceMarker(event: Event) {
  const searchableText = [
    event.title,
    event.subtitle,
    event.description,
  ]
    .map(normalize)
    .join(' ')

  return hiddenTextMarkers.some((marker) => searchableText.includes(marker))
}

export function isEventVisibleForRole(event: Event, role: UserRole) {
  if (role === 'participant') {
    return true
  }

  if (event.eventType === 'требуется приглашение') {
    return false
  }

  return !hasServiceMarker(event)
}

export function filterProgramForRole<TEvent extends Event>(
  events: TEvent[],
  role: UserRole
) {
  return events.filter((event) => isEventVisibleForRole(event, role))
}
