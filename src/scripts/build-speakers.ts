import fs from 'fs'
import type { Event } from '@/lib/types/event'
import type { Speaker } from '@/lib/types/speaker'

const program = JSON.parse(
  fs.readFileSync(
    'src/data/program.json',
    'utf-8'
  )
) as Event[]

const existingSpeakers = fs.existsSync('src/data/speakers.json')
  ? JSON.parse(fs.readFileSync('src/data/speakers.json', 'utf-8')) as Speaker[]
  : []

type BuiltSpeaker = {
  name: string
  position: string
  image: string | null
  imageSource?: string | null
}

const speakersMap = new Map<string, BuiltSpeaker>()
const existingSpeakersMap = new Map(
  existingSpeakers
    .filter((speaker) => speaker.name)
    .map((speaker) => [speaker.name, speaker])
)

function extractPosition(
  description: string,
  speaker: string
) {
  const text = description.replace(/\n/g, ' ')

  const index = text.indexOf(speaker)

  if (index === -1) {
    return ''
  }

  const afterName = text.slice(
    index + speaker.length
  )

  const dashIndex = afterName.indexOf('-')

  if (dashIndex === -1) {
    return ''
  }

  const afterDash = afterName.slice(
    dashIndex + 1
  )

  const endIndex = afterDash.indexOf('.')

  if (endIndex === -1) {
    return afterDash.trim()
  }

  return afterDash
    .slice(0, endIndex)
    .trim()
}

program.forEach((event) => {
  const description =
    event.description || ''

  ;(event.speakers || []).forEach(
    (speaker: string) => {
      if (speakersMap.has(speaker)) {
        return
      }

      const position = extractPosition(
        description,
        speaker
      )

      const filename = speaker
        .replace(/\s+/g, '-')
        .replace(/ё/g, 'е')
      const existingSpeaker = existingSpeakersMap.get(speaker)
      const externalImage =
        `https://www.soud.ru/bd/SPIKER/BEER/foto/${filename}.jpg`

      speakersMap.set(speaker, {
        name: speaker,
        position: position || existingSpeaker?.position || '',
        image: existingSpeaker?.image ?? externalImage,
        imageSource: existingSpeaker?.imageSource ?? externalImage,
      })
    }
  )
})

const speakers = Array.from(
  speakersMap.values()
)

fs.writeFileSync(
  'src/data/speakers.json',
  JSON.stringify(speakers, null, 2)
)

console.log(
  JSON.stringify(
    speakers.slice(0, 5),
    null,
    2
  )
)

console.log(
  `Built ${speakers.length} speakers`
)
