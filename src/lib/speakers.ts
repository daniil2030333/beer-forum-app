import type { Speaker } from '@/lib/types/speaker'

export type { Speaker } from '@/lib/types/speaker'

export function getSpeakerRouteId(speaker: Speaker) {
  return String(speaker.id || speaker.name || '').trim()
}

export function getSpeakerHref(speaker: Speaker) {
  const id = getSpeakerRouteId(speaker)

  return `/speakers/${encodeURIComponent(id)}`
}

export function normalizeSpeakerName(value: string) {
  try {
    return decodeURIComponent(value).trim().toLowerCase()
  } catch {
    return value.trim().toLowerCase()
  }
}

export function findSpeakerByName(
  speakerList: Speaker[],
  value: string
) {
  const normalizedValue = normalizeSpeakerName(value)

  return speakerList.find((speaker) => {
    const id = speaker.id
      ? normalizeSpeakerName(String(speaker.id))
      : ''
    const name = speaker.name
      ? normalizeSpeakerName(speaker.name)
      : ''

    return id === normalizedValue || name === normalizedValue
  })
}

export function getSpeakerInitials(name?: string) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}
