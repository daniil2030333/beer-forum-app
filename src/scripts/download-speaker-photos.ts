import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Speaker } from '@/lib/types/speaker'

type SpeakerWithPhoto = Speaker & {
  image: string | null
  imageSource?: string | null
}

type FailedDownload = {
  speaker: string
  url: string
  reason: string
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const speakersPath = path.resolve(__dirname, '../data/speakers.json')
const reportPath = path.resolve(__dirname, '../data/speaker-photo-report.json')
const photoDirectory = path.resolve(__dirname, '../../public/speaker-photos')
const publicPhotoDirectory = '/speaker-photos'

const cyrillicToLatin: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

function transliterate(value: string) {
  return value
    .toLowerCase()
    .split('')
    .map((char) => cyrillicToLatin[char] ?? char)
    .join('')
    .replace(/iy\b/g, 'y')
    .replace(/yy\b/g, 'y')
    .replace(/ks/g, 'x')
}

function createSlug(value: string) {
  return transliterate(value)
    .replace(/[«»"'`’‘“”]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
}

function getExtensionFromUrl(url: string) {
  try {
    const extension = path.extname(new URL(url).pathname).toLowerCase()
    return extension || '.jpg'
  } catch {
    const extension = path.extname(url.split('?')[0]).toLowerCase()
    return extension || '.jpg'
  }
}

function createSafePhotoFilename(speakerName: string, originalUrl: string) {
  const slug = createSlug(speakerName) || 'speaker-photo'
  return `${slug}${getExtensionFromUrl(originalUrl)}`
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function downloadPhoto(speakerName: string, url: string) {
  await fs.mkdir(photoDirectory, { recursive: true })

  const fileName = createSafePhotoFilename(speakerName, url)
  const filePath = path.join(photoDirectory, fileName)
  const publicPath = `${publicPhotoDirectory}/${fileName}`

  if (await fileExists(filePath)) {
    return {
      image: publicPath,
      skippedExisting: true,
    }
  }

  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw new Error(`Invalid content-type: ${contentType || 'unknown'}`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length <= 1024) {
    throw new Error(`File too small: ${bytes.length} bytes`)
  }

  await fs.writeFile(filePath, bytes)

  return {
    image: publicPath,
    skippedExisting: false,
  }
}

async function main() {
  const speakers = JSON.parse(
    await fs.readFile(speakersPath, 'utf8')
  ) as SpeakerWithPhoto[]

  const failedDownloads: FailedDownload[] = []
  let downloaded = 0
  let skippedExisting = 0

  const updatedSpeakers: SpeakerWithPhoto[] = []

  for (const speaker of speakers) {
    const name = speaker.name || 'speaker'
    const currentImage = speaker.image

    if (currentImage && !currentImage.startsWith('http')) {
      const localFilePath = path.join(
        photoDirectory,
        currentImage.replace(`${publicPhotoDirectory}/`, '')
      )

      if (await fileExists(localFilePath)) {
        skippedExisting += 1
        updatedSpeakers.push({
          ...speaker,
          imageSource: speaker.imageSource ?? null,
        })
        continue
      }
    }

    const imageSource = currentImage?.startsWith('http')
      ? currentImage
      : speaker.imageSource ?? null

    if (!imageSource) {
      updatedSpeakers.push({
        ...speaker,
        image: null,
        imageSource: null,
      })
      continue
    }

    try {
      const result = await downloadPhoto(name, imageSource)
      if (result.skippedExisting) {
        skippedExisting += 1
      } else {
        downloaded += 1
      }

      updatedSpeakers.push({
        ...speaker,
        image: result.image,
        imageSource,
      })
    } catch (error) {
      failedDownloads.push({
        speaker: name,
        url: imageSource,
        reason: error instanceof Error ? error.message : String(error),
      })
      updatedSpeakers.push({
        ...speaker,
        image: null,
        imageSource,
      })
    }
  }

  const report = {
    totalSpeakers: updatedSpeakers.length,
    downloaded,
    skippedExisting,
    failedDownloads,
  }

  await fs.writeFile(
    speakersPath,
    `${JSON.stringify(updatedSpeakers, null, 2)}\n`
  )
  await fs.writeFile(
    reportPath,
    `${JSON.stringify(report, null, 2)}\n`
  )

  console.log(
    `Done. Downloaded: ${downloaded}. Skipped existing: ${skippedExisting}. Failed: ${failedDownloads.length}.`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
