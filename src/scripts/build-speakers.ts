import fs from 'fs'
import type { Event } from '@/lib/types/event'
import type { Speaker } from '@/lib/types/speaker'

const programPath = 'src/data/program.json'
const speakersPath = 'src/data/speakers.json'
const sourcePath = 'src/data/speaker-source.json'
const reportPath = 'src/data/speakers-build-report.json'
const debugReportPath = 'src/data/speaker-source-debug-report.json'

type SourceSpeaker = {
  name: string
  position?: string
  company?: string
  description?: string
  imageSource?: string | null
  city?: string
  source?: string
}

type SpeakerBuildReport = {
  totalProgramSpeakerNames: number
  totalSpeakersInDatabase: number
  addedMissingSpeakers: string[]
  speakersWithoutImage: string[]
  speakersWithoutPosition: string[]
  sourceMatchedSpeakers: string[]
  sourceUnmatchedSpeakers: Array<{
    name: string
    reason: string
  }>
  updatedFromSource: string[]
}

function normalizePersonName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/ё/g, 'е')
    .replace(/Ё/g, 'Е')
    .replace(/[.,«»"'`’‘“”()]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function getNameTokens(value: string) {
  return normalizePersonName(value)
    .split(' ')
    .filter((token) => token.length > 1)
}

function isSamePersonName(name: string, candidate: string) {
  const tokens = getNameTokens(name)
  const candidateTokens = new Set(getNameTokens(candidate))

  return tokens.length > 0 && tokens.every((token) => candidateTokens.has(token))
}

function readJsonFile<T>(path: string, fallback: T) {
  if (!fs.existsSync(path)) {
    return fallback
  }

  return JSON.parse(fs.readFileSync(path, 'utf-8')) as T
}

function getProgramSpeakerNames(program: Event[]) {
  const names: string[] = []
  const seenNames = new Set<string>()

  program.forEach((event) => {
    ;(event.speakers || []).forEach((speakerName) => {
      const cleanedName = speakerName.trim().replace(/\s+/g, ' ')
      const normalizedName = normalizePersonName(cleanedName)

      if (!cleanedName || seenNames.has(normalizedName)) {
        return
      }

      seenNames.add(normalizedName)
      names.push(cleanedName)
    })
  })

  return names
}

function createMissingSpeaker(name: string): Speaker {
  return {
    id: name,
    name,
    position: '',
    company: '',
    description: '',
    image: null,
    imageSource: null,
  }
}

function getSpeakerName(speaker: Speaker) {
  return String(speaker.name || speaker.id || '').trim()
}

const program = readJsonFile<Event[]>(programPath, [])
const existingSpeakers = readJsonFile<Speaker[]>(speakersPath, [])
const sourceSpeakers = readJsonFile<SourceSpeaker[]>(sourcePath, [])
const programSpeakerNames = getProgramSpeakerNames(program)

const existingSpeakerNames = new Set(
  existingSpeakers
    .map(getSpeakerName)
    .filter(Boolean)
    .map(normalizePersonName)
)

const addedMissingSpeakers: string[] = []
const nextSpeakers = [...existingSpeakers]

programSpeakerNames.forEach((speakerName) => {
  const normalizedName = normalizePersonName(speakerName)

  if (existingSpeakerNames.has(normalizedName)) {
    return
  }

  nextSpeakers.push(createMissingSpeaker(speakerName))
  existingSpeakerNames.add(normalizedName)
  addedMissingSpeakers.push(speakerName)
})

const sourceMatchedSpeakers: string[] = []
const sourceUnmatchedSpeakers: SpeakerBuildReport['sourceUnmatchedSpeakers'] = []
const updatedFromSource: string[] = []

function findSourceSpeaker(name: string) {
  return sourceSpeakers.find((sourceSpeaker) =>
    isSamePersonName(name, sourceSpeaker.name)
  )
}

function applySourceData(speaker: Speaker, sourceSpeaker: SourceSpeaker) {
  const nextSpeaker = { ...speaker }
  let updated = false

  if (sourceSpeaker.position?.trim() && !nextSpeaker.position?.trim()) {
    nextSpeaker.position = sourceSpeaker.position.trim()
    updated = true
  }

  if (sourceSpeaker.company?.trim() && !nextSpeaker.company?.trim()) {
    nextSpeaker.company = sourceSpeaker.company.trim()
    updated = true
  }

  if (sourceSpeaker.description?.trim() && !nextSpeaker.description?.trim()) {
    nextSpeaker.description = sourceSpeaker.description.trim()
    updated = true
  }

  if (sourceSpeaker.city?.trim() && !nextSpeaker.city?.trim()) {
    nextSpeaker.city = sourceSpeaker.city.trim().replace(/^г\.\s*/i, '')
    updated = true
  }

  if (sourceSpeaker.imageSource && !nextSpeaker.imageSource) {
    nextSpeaker.imageSource = sourceSpeaker.imageSource
    updated = true
  }

  return {
    speaker: nextSpeaker,
    updated,
  }
}

for (let index = 0; index < nextSpeakers.length; index += 1) {
  const speakerName = getSpeakerName(nextSpeakers[index])

  if (!speakerName) {
    continue
  }

  const sourceSpeaker = findSourceSpeaker(speakerName)

  if (!sourceSpeaker) {
    if (programSpeakerNames.some((name) => isSamePersonName(name, speakerName))) {
      sourceUnmatchedSpeakers.push({
        name: speakerName,
        reason: 'No matching source speaker found by normalized tokens',
      })
    }
    continue
  }

  sourceMatchedSpeakers.push(speakerName)
  const result = applySourceData(nextSpeakers[index], sourceSpeaker)
  nextSpeakers[index] = result.speaker

  if (result.updated) {
    updatedFromSource.push(speakerName)
  }
}

const speakersWithoutImage = nextSpeakers
  .filter((speaker) => !speaker.image)
  .map(getSpeakerName)
  .filter(Boolean)

const speakersWithoutPosition = nextSpeakers
  .filter((speaker) => !speaker.position?.trim())
  .map(getSpeakerName)
  .filter(Boolean)

const report: SpeakerBuildReport = {
  totalProgramSpeakerNames: programSpeakerNames.length,
  totalSpeakersInDatabase: nextSpeakers.length,
  addedMissingSpeakers,
  speakersWithoutImage,
  speakersWithoutPosition,
  sourceMatchedSpeakers,
  sourceUnmatchedSpeakers,
  updatedFromSource,
}

fs.writeFileSync(
  speakersPath,
  `${JSON.stringify(nextSpeakers, null, 2)}\n`
)

fs.writeFileSync(
  reportPath,
  `${JSON.stringify(report, null, 2)}\n`
)

const ludmilaSource = sourceSpeakers.find((speaker) =>
  isSamePersonName('Людмила Ширяева', speaker.name)
)
const ludmilaSpeaker = nextSpeakers.find((speaker) =>
  isSamePersonName('Людмила Ширяева', getSpeakerName(speaker))
)

fs.writeFileSync(
  debugReportPath,
  `${JSON.stringify(
    {
      searchedName: 'Людмила Ширяева',
      checkedUrls: [
        'https://www.beersochi.ru',
        'https://www.beersochi.ru/?speaker=lyudmila-shiryaeva#spiker',
        sourceSpeakers[0]?.source ?? sourcePath,
      ],
      foundInHtml: Boolean(ludmilaSource),
      matchedSourceName: ludmilaSource?.name ?? null,
      imageSource: ludmilaSpeaker?.imageSource ?? ludmilaSource?.imageSource ?? null,
      position: ludmilaSpeaker?.position ?? ludmilaSource?.position ?? '',
      company: ludmilaSpeaker?.company ?? ludmilaSource?.company ?? '',
      descriptionLength:
        (ludmilaSpeaker?.description ?? ludmilaSource?.description ?? '').length,
    },
    null,
    2
  )}\n`
)

console.log(
  JSON.stringify(
    {
      totalProgramSpeakerNames: report.totalProgramSpeakerNames,
      totalSpeakersInDatabase: report.totalSpeakersInDatabase,
      addedMissingSpeakers: report.addedMissingSpeakers,
    },
    null,
    2
  )
)
