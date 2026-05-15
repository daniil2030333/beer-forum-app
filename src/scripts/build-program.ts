import axios from 'axios'
import fs from 'fs'
import { parse } from 'csv-parse/sync'
import crypto from 'crypto'
import type { ProgramEventType } from '../lib/types/event'

type ProgramRow = {
  day?: string
  time?: string
  title?: string
  location?: string
  speakers?: string
}

type ProgramEventDraft = {
  day: string
  time: string
  title: string
  subtitle?: string
  description: string
  location: string
  speakers: string[]
}

type ProgramEvent = ProgramEventDraft & {
  id: string
  eventType: ProgramEventType | null
}

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1P2kqnwEa1qATUZqwpA-gmYgXU_jAAmBJycIaBDXq1tY/export?format=csv&gid=486939963'

function cleanMarkdown(text: string = '') {
  return text
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function normalizeForCompare(text: string = '') {
  return cleanMarkdown(text)
    .replace(/[«»“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function stripDuplicateTitle(description: string, title: string) {
  const cleanDescription = cleanMarkdown(description)
  const cleanTitle = cleanMarkdown(title)

  if (!cleanDescription || !cleanTitle) {
    return cleanDescription
  }

  if (normalizeForCompare(cleanDescription) === normalizeForCompare(cleanTitle)) {
    return ''
  }

  if (normalizeForCompare(cleanDescription).startsWith(normalizeForCompare(cleanTitle))) {
    return cleanDescription.slice(cleanTitle.length).replace(/^[\s.:;\-–—]+/, '').trim()
  }

  return cleanDescription
}

function stripLeadingText(description: string, text: string) {
  const cleanDescription = cleanMarkdown(description)
  const cleanText = cleanMarkdown(text)

  if (!cleanDescription || !cleanText) {
    return cleanDescription
  }

  if (normalizeForCompare(cleanDescription) === normalizeForCompare(cleanText)) {
    return ''
  }

  if (normalizeForCompare(cleanDescription).startsWith(normalizeForCompare(cleanText))) {
    return cleanDescription.slice(cleanText.length).replace(/^[\s.:;\-–—]+/, '').trim()
  }

  return cleanDescription
}

function cleanHeading(text: string) {
  let value = cleanMarkdown(text).replace(/[.]$/, '').trim()
  const quotePairs: Array<[string, string]> = [
    ['"', '"'],
    ['«', '»'],
    ['“', '”'],
  ]

  for (const [open, close] of quotePairs) {
    if (value.startsWith(open) && value.endsWith(close)) {
      value = value.slice(open.length, -close.length).trim()
      break
    }
  }

  return value
    .replace(/^[\s"«“]+/, '')
    .replace(/"\s*\(/g, ' (')
    .replace(/[.]$/, '')
    .trim()
}

function normalizeDescriptionText(text: string) {
  return cleanMarkdown(text)
    .split('\n')
    .map((line) =>
      line
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/\.{2,}/g, '.')
        .trim()
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function splitSentences(text: string) {
  return normalizeDescriptionText(text)
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function hasServiceText(text: string) {
  return /с участием|официальное подписание|в рамках|при поддержке|совместно с/i.test(text)
}

function compactOfficialTitle(title: string) {
  const normalizedTitle = normalizeDescriptionText(title).replace(/[.]$/, '')

  if (/^торжественная церемония открытия/i.test(normalizedTitle)) {
    return 'Торжественная церемония открытия Форума'
  }

  return normalizedTitle
    .replace(/\s+с участием\b.*$/i, '')
    .replace(/\s+в рамках\b.*$/i, '')
    .replace(/\s+при поддержке\b.*$/i, '')
    .replace(/\s+совместно с\b.*$/i, '')
    .replace(/[.]$/, '')
    .trim()
}

function splitLongOfficialTitle(title: string, description: string) {
  const normalizedTitle = normalizeDescriptionText(title)
  const normalizedDescription = normalizeDescriptionText(description)
  const sentences = splitSentences(normalizedTitle)
  const shouldSplit =
    normalizedTitle.length > 120 ||
    sentences.length > 1 ||
    hasServiceText(normalizedTitle)

  if (!shouldSplit) {
    return {
      title: normalizedTitle,
      description: normalizedDescription,
    }
  }

  const firstSentence = sentences[0] || normalizedTitle
  const nextTitle = compactOfficialTitle(firstSentence)
  const restSentences = sentences.slice(1)
  const firstDescription = firstSentence === nextTitle
    ? ''
    : firstSentence.replace(/^торжественная церемония открытия[^.]*?с участием/i, `${nextTitle} с участием`)

  const strippedDescription = stripLeadingText(normalizeDescriptionText([
    firstDescription,
    ...restSentences,
    normalizedDescription,
  ].filter(Boolean).join('\n\n')), nextTitle || normalizedTitle)
  const nextDescription = strippedDescription.replace(/^с участием/i, 'С участием')

  return {
    title: nextTitle || normalizedTitle,
    description: nextDescription,
  }
}

function extractTopic(description: string) {
  const lines = cleanMarkdown(description).split('\n')
  const topicIndex = lines.findIndex((line) => /^\s*тема\s*:/i.test(line))

  if (topicIndex === -1) {
    return {
      topic: null,
      description,
    }
  }

  const topic = cleanHeading(lines[topicIndex].replace(/^\s*тема\s*:\s*/i, ''))
  const nextDescription = lines
    .filter((_, index) => index !== topicIndex)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return {
    topic: topic || null,
    description: nextDescription,
  }
}

function normalizeSearchText(text: string = '') {
  return cleanMarkdown(text)
    .replace(/[«»“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function startsAfterSix(time: string) {
  const match = time.match(/(\d{1,2})[.:](\d{2})/)

  if (!match) {
    return false
  }

  const [, hours, minutes] = match
  const totalMinutes = Number(hours) * 60 + Number(minutes)

  return totalMinutes >= 18 * 60
}

function isOperationalEntry(event: ProgramEventDraft) {
  const text = normalizeSearchText(`${event.title} ${event.description}`)

  return [
    /^заезд(?:\s|$)/,
    /^прием образцов(?:\s|$)/,
    /^приём образцов(?:\s|$)/,
    /^работа xxxv(?:\s|$)/,
    /^работа международного(?:\s|$)/,
    /^работа фестиваля(?:\s|$)/,
    /^оформление стендов(?:\s|$)/,
  ].some((test) => test.test(text))
}

function detectProgramEventType(event: ProgramEventDraft): ProgramEventType | null {
  const text = normalizeSearchText(
    `${event.title} ${event.subtitle || ''} ${event.description} ${event.location}`
  )

  if (
    event.day.trim() === '22 мая' ||
    startsAfterSix(event.time) ||
    /вечерний прием|вечерний приём|банкет|фуршет|торжественный ужин|гала|праздничный вечер|церемония награждения|требуется приглашение/.test(text)
  ) {
    return 'требуется приглашение'
  }

  if (/пресс-конференция/.test(text)) {
    return 'пресс-конференция'
  }

  if (/круглый стол/.test(text)) {
    return 'круглый стол'
  }

  if (/мастер-класс|мастеркласс/.test(text)) {
    return 'мастер-класс'
  }

  if (/презентация/.test(text)) {
    return 'презентация'
  }

  if (!isOperationalEntry(event) && /сессия/.test(text)) {
    return 'сессия'
  }

  return null
}

function buildEventTypeReport(events: Array<ProgramEventDraft & { eventType: ProgramEventType | null }>) {
  const byEventType: Record<ProgramEventType | 'null', number> = {
    'сессия': 0,
    'мастер-класс': 0,
    'презентация': 0,
    'пресс-конференция': 0,
    'круглый стол': 0,
    'требуется приглашение': 0,
    null: 0,
  }

  for (const event of events) {
    byEventType[event.eventType ?? 'null'] += 1
  }

  return {
    totalEvents: events.length,
    byEventType,
    eventsByType: byEventType,
    uncategorizedEvents: events
      .filter((event) => event.eventType === null)
      .map(reportEvent),
  }
}

function reportEvent(event: ProgramEvent) {
  return {
    id: event.id,
    day: event.day,
    time: event.time,
    title: event.title,
    location: event.location,
  }
}

function buildQualityReport(events: ProgramEvent[]) {
  const normalizedDescriptions = events.map((event) => ({
    event,
    normalizedTitle: normalizeForCompare(event.title),
    normalizedSubtitle: normalizeForCompare(event.subtitle || ''),
    normalizedDescription: normalizeForCompare(event.description),
  }))
  const duplicateGroups = new Map<string, ProgramEvent[]>()

  for (const event of events) {
    const key = [
      normalizeForCompare(event.day),
      normalizeForCompare(event.time),
      normalizeForCompare(event.title),
    ].join('|')
    const group = duplicateGroups.get(key) || []
    group.push(event)
    duplicateGroups.set(key, group)
  }

  const festivalEvent = events.find((event) =>
    normalizeForCompare(event.title).includes('работа фестиваля "море пива в сочи"')
  )

  return {
    totalEvents: events.length,
    eventsWithSubtitle: events.filter((event) => Boolean(event.subtitle)).length,
    eventsByType: buildEventTypeReport(events).byEventType,
    uncategorizedEvents: events
      .filter((event) => event.eventType === null)
      .map(reportEvent),
    emptyDescriptions: events.filter((event) => !event.description.trim()).length,
    eventsWithoutId: events.filter((event) => !event.id).map(reportEvent),
    eventsWithoutLocation: events.filter((event) => !event.location.trim()).map(reportEvent),
    eventsWithoutTime: events.filter((event) => !event.time.trim()).map(reportEvent),
    eventsWithoutTitle: events.filter((event) => !event.title.trim()).map(reportEvent),
    descriptionsEqualTitle: normalizedDescriptions
      .filter(({ normalizedDescription, normalizedTitle }) =>
        Boolean(normalizedDescription) && normalizedDescription === normalizedTitle
      )
      .map(({ event }) => reportEvent(event)),
    descriptionsStartingWithTitle: normalizedDescriptions
      .filter(({ normalizedDescription, normalizedTitle }) =>
        Boolean(normalizedDescription) &&
        Boolean(normalizedTitle) &&
        normalizedDescription.startsWith(normalizedTitle)
      )
      .map(({ event }) => reportEvent(event)),
    descriptionsStartingWithSubtitle: normalizedDescriptions
      .filter(({ normalizedDescription, normalizedSubtitle }) =>
        Boolean(normalizedDescription) &&
        Boolean(normalizedSubtitle) &&
        normalizedDescription.startsWith(normalizedSubtitle)
      )
      .map(({ event }) => reportEvent(event)),
    possibleDuplicates: Array.from(duplicateGroups.values())
      .filter((group) => group.length > 1)
      .map((group) => group.map(reportEvent)),
    longDescriptions: events
      .filter((event) => event.description.length > 900)
      .map((event) => ({
        ...reportEvent(event),
        descriptionLength: event.description.length,
      })),
    festivalCheck: festivalEvent
      ? {
          found: true,
          titleDoesNotContainProgramText: !/ежедневно в программе/i.test(festivalEvent.title),
          descriptionStartsWithProgramText:
            festivalEvent.description.startsWith('Ежедневно в программе'),
          locationIsFestivalArea: festivalEvent.location === 'Фестивальная площадка',
        }
      : {
          found: false,
          titleDoesNotContainProgramText: false,
          descriptionStartsWithProgramText: false,
          locationIsFestivalArea: false,
        },
  }
}

async function buildProgram() {
  const response = await axios.get(CSV_URL)

  const records = parse(response.data, {
    columns: [
      'empty',
      'day',
      'time',
      'title',
      'location',
      'speakers',
    ],
    from_line: 3,
    skip_empty_lines: true,
  }) as ProgramRow[]

  const events: ProgramEvent[] = records
    .filter((row) => row.time)
    .map((row) => {
      const titleRaw = row.title || ''

      const title =
        titleRaw.split('\n')[0] || ''
      const cleanTitle = cleanHeading(title)
      const descriptionWithoutTitle = stripDuplicateTitle(titleRaw, cleanTitle)
      const topicResult = extractTopic(descriptionWithoutTitle)
      const finalTitle = topicResult.topic || cleanTitle
      const subtitle = topicResult.topic ? cleanTitle : undefined
      const cleanDescription = stripLeadingText(
        stripLeadingText(topicResult.description, finalTitle),
        subtitle || ''
      )
      const titleDescriptionResult = splitLongOfficialTitle(
        finalTitle,
        cleanDescription
      )

      const eventDraft: ProgramEventDraft = {
        day: row.day?.trim() || '',
        time: row.time?.trim() || '',
        title: titleDescriptionResult.title,
        ...(subtitle ? { subtitle } : {}),
        description: titleDescriptionResult.description,
        location: row.location?.trim() || '',
        speakers: row.speakers
          ? row.speakers
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
      }

      return {
        id: crypto
          .createHash('md5')
          .update(title + row.time)
          .digest('hex'),

        ...eventDraft,

        eventType: detectProgramEventType(eventDraft),
      }
    })
  const report = buildEventTypeReport(events)
  const qualityReport = buildQualityReport(events)

  fs.writeFileSync(
    'src/data/program.json',
    JSON.stringify(events, null, 2)
  )

  fs.writeFileSync(
    'src/data/program-event-type-report.json',
    JSON.stringify(report, null, 2)
  )

  fs.writeFileSync(
    'src/data/program-quality-report.json',
    JSON.stringify(qualityReport, null, 2)
  )

  console.log(`Loaded ${events.length} events`)
  console.log(report)
  console.log(qualityReport)

  console.log(events.slice(0, 3))
}

buildProgram()
