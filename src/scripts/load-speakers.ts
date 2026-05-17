import fs from 'fs'
import { parse } from 'csv-parse/sync'

const sourceCsvUrl =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7bJWwC3TkrX-d2BHuxOIh8iClmVpOOAgjeDFu7tE9d6a-bQBA85gx5WxNxMeLrU4a4Gp6EXIPtMac/pub?gid=1988051888&single=true&output=csv'
const sourcePath = 'src/data/speaker-source.json'
const debugReportPath = 'src/data/speaker-source-debug-report.json'

type SourceSpeaker = {
  name: string
  firstName: string
  lastName: string
  position: string
  company: string
  description: string
  imageSource: string | null
  city: string
  source: string
}

function normalizeCell(value: unknown) {
  return String(value || '').trim()
}

function normalizeBio(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim().replace(/^[-•]\s*/, ''))
    .filter(Boolean)
    .join('\n')
}

async function loadSpeakers() {
  const response = await fetch(sourceCsvUrl, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to load speaker source: HTTP ${response.status}`)
  }

  const csv = await response.text()
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
  }) as Array<Record<string, string>>

  const speakers: SourceSpeaker[] = rows
    .map((row) => {
      const firstName = normalizeCell(row.FirstName)
      const lastName = normalizeCell(row.LastName)
      const name = `${firstName} ${lastName}`.trim()

      return {
        name,
        firstName,
        lastName,
        position: normalizeCell(row.Position),
        company: normalizeCell(row.Company),
        description: normalizeBio(normalizeCell(row.Bio)),
        imageSource: normalizeCell(row.Photo) || null,
        city: normalizeCell(row.City),
        source: sourceCsvUrl,
      }
    })
    .filter((speaker) => speaker.name)

  fs.writeFileSync(
    sourcePath,
    `${JSON.stringify(speakers, null, 2)}\n`
  )

  const ludmila = speakers.find((speaker) =>
    speaker.name.toLowerCase().includes('людмила') ||
    speaker.name.toLowerCase().includes('ширяева')
  )

  fs.writeFileSync(
    debugReportPath,
    `${JSON.stringify(
      {
        searchedName: 'Людмила Ширяева',
        checkedUrls: [
          'https://www.beersochi.ru',
          'https://www.beersochi.ru/?speaker=lyudmila-shiryaeva#spiker',
          sourceCsvUrl,
        ],
        foundInHtml: Boolean(ludmila),
        matchedSourceName: ludmila?.name ?? null,
        imageSource: ludmila?.imageSource ?? null,
        position: ludmila?.position ?? '',
        company: ludmila?.company ?? '',
        descriptionLength: ludmila?.description.length ?? 0,
      },
      null,
      2
    )}\n`
  )

  console.log(
    JSON.stringify(
      {
        loadedSpeakers: speakers.length,
        ludmilaFound: Boolean(ludmila),
        ludmila,
      },
      null,
      2
    )
  )
}

loadSpeakers().catch((error) => {
  console.error(error)
  process.exit(1)
})
