import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Company } from '@/lib/types/company'

type LogoCandidate = {
  url: string
  fileName: string
  normalizedName: string
}

type LogoMatch = {
  company: string
  logo: string
  logoSource: string | null
  score: number
  method: string
}

type CompanyWithLogo = Company & {
  logo: string | null
  logoSource?: string | null
}

const siteUrl = 'https://www.beersochi.ru'
const logoUrlPattern =
  /(?:https?:)?\/\/www\.soud\.ru\/baers_uch\/[^"'`)\\\s<>]+?\.(?:png|jpe?g|webp|svg)(?:\?[^"'`)\\\s<>]*)?/gi
const relativeLogoPattern =
  /\/baers_uch\/[^"'`)\\\s<>]+?\.(?:png|jpe?g|webp|svg)(?:\?[^"'`)\\\s<>]*)?/gi
const imageExtensions = /\.(?:png|jpe?g|webp|svg)(?:\?|$)/i
const scriptOrStylePattern =
  /<(?:script|link)\b[^>]+(?:src|href)=["']([^"']+)["'][^>]*>/gi

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const companiesPath = path.resolve(__dirname, '../data/companies.json')
const reportPath = path.resolve(__dirname, '../data/company-logo-report.json')
const logoDirectory = path.resolve(__dirname, '../../public/company-logos')
const publicLogoDirectory = '/company-logos'

const legalForms = [
  'ooo',
  'oao',
  'zao',
  'ao',
  'ip',
  'llc',
  'ltd',
  'spa',
  'srl',
  'ооо',
  'оао',
  'зао',
  'ао',
  'ип',
]

const stopWords = new Set([
  ...legalForms,
  'компания',
  'группа',
  'завод',
  'газета',
  'портал',
  'пивоварня',
  'ресторан',
  'пивной',
  'пивного',
  'рынка',
  'beer',
  'beers',
  'brewery',
  'company',
  'group',
  'technologies',
  'technology',
  'portal',
  'logo',
  'new',
  'rus',
  'russia',
  'solod',
])

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

function decodeLoose(value: string) {
  let decoded = value

  for (let index = 0; index < 2; index += 1) {
    try {
      decoded = decodeURIComponent(decoded)
    } catch {
      break
    }
  }

  return decoded
    .replace(/&amp;/g, '&')
    .replace(/\\\//g, '/')
    .replace(/\\u002F/g, '/')
}

function normalizeUrl(value: string) {
  const decoded = decodeLoose(value.trim())
  const absolute = decoded.startsWith('//')
    ? `https:${decoded}`
    : decoded.startsWith('/baers_uch/')
      ? `https://www.soud.ru${decoded}`
      : decoded

  try {
    const url = new URL(absolute)
    url.hash = ''
    return url.toString()
  } catch {
    return absolute
  }
}

function getFileName(url: string) {
  try {
    return decodeLoose(path.basename(new URL(url).pathname))
  } catch {
    return decodeLoose(path.basename(url.split('?')[0]))
  }
}

function stripExtension(value: string) {
  return value.replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
}

function getExtensionFromUrl(url: string) {
  try {
    const extension = path.extname(new URL(url).pathname).toLowerCase()
    return extension || '.png'
  } catch {
    const extension = path.extname(url.split('?')[0]).toLowerCase()
    return extension || '.png'
  }
}

function normalizeName(value: string) {
  const withoutExtension = stripExtension(decodeLoose(value))
  const withoutLegalForms = legalForms.reduce(
    (current, form) => current.replace(new RegExp(`\\b${form}\\b`, 'gi'), ' '),
    withoutExtension
  )

  return withoutLegalForms
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"'`’‘“”]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

function normalizeVariants(value: string) {
  const normalized = normalizeName(value)
  const transliterated = normalizeName(transliterate(value))
  const latinTweaks = transliterated
    .replace(/\bservis\b/g, 'service')
    .replace(/\bkraft\b/g, 'craft')
    .replace(/greyn/g, 'grain')
    .replace(/tehn/g, 'techn')

  return [...new Set([normalized, transliterated, latinTweaks].filter(Boolean))]
}

function createSlug(value: string) {
  return normalizeName(transliterate(value))
    .replace(/\b(and|the)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
}

function createSafeLogoFilename(companyName: string, originalUrl: string) {
  const extension = getExtensionFromUrl(originalUrl)
  const slug = createSlug(companyName) || createSlug(getFileName(originalUrl)) || 'company-logo'

  return `${slug}${extension}`
}

function compact(value: string) {
  return value.replace(/\s+/g, '')
}

function tokens(value: string) {
  return normalizeVariants(value)
    .flatMap((variant) => variant.split(' '))
    .filter((token) => token.length > 3 && !stopWords.has(token))
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, (_, row) =>
    Array.from({ length: b.length + 1 }, (__, column) =>
      row === 0 ? column : column === 0 ? row : 0
    )
  )

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      )
    }
  }

  return matrix[a.length][b.length]
}

function tokensMatch(a: string, b: string) {
  if (a === b || a.includes(b) || b.includes(a)) {
    return true
  }

  const maxLength = Math.max(a.length, b.length)
  if (maxLength < 6) {
    return false
  }

  return levenshtein(a, b) <= (maxLength > 9 ? 2 : 1)
}

function extractLogoUrls(source: string) {
  const decoded = decodeLoose(source)
  const matches = [
    ...decoded.matchAll(logoUrlPattern),
    ...decoded.matchAll(relativeLogoPattern),
  ]

  return matches
    .map((match) => normalizeUrl(match[0]))
    .filter((url) => url.includes('soud.ru/baers_uch') && imageExtensions.test(url))
}

function extractAssetUrls(html: string) {
  const urls = new Set<string>()

  for (const match of html.matchAll(scriptOrStylePattern)) {
    try {
      urls.add(new URL(match[1], siteUrl).toString())
    } catch {
      // Ignore malformed asset references.
    }
  }

  return [...urls].filter((url) => url.startsWith(siteUrl))
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return response.text()
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function collectLocalLogoCandidates(): Promise<LogoCandidate[]> {
  await fs.mkdir(logoDirectory, { recursive: true })

  const files = await fs.readdir(logoDirectory)

  return files
    .filter((fileName) => imageExtensions.test(fileName))
    .map((fileName) => ({
      url: `${publicLogoDirectory}/${fileName}`,
      fileName,
      normalizedName: normalizeName(fileName),
    }))
    .filter((candidate) => candidate.normalizedName)
}

async function downloadLogo(
  companyName: string,
  logoSource: string
) {
  await fs.mkdir(logoDirectory, { recursive: true })

  const fileName = createSafeLogoFilename(companyName, logoSource)
  const filePath = path.join(logoDirectory, fileName)
  const publicPath = `${publicLogoDirectory}/${fileName}`

  if (await fileExists(filePath)) {
    return {
      logo: publicPath,
      skippedExisting: true,
    }
  }

  const response = await fetch(logoSource, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to download ${logoSource}: ${response.status}`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(filePath, bytes)

  return {
    logo: publicPath,
    skippedExisting: false,
  }
}

async function collectWithFetch() {
  const html = await fetchText(siteUrl)
  const sources = [html]
  const assetUrls = extractAssetUrls(html)

  for (const assetUrl of assetUrls) {
    try {
      sources.push(await fetchText(assetUrl))
    } catch {
      // Third-party or blocked assets are not required for logo extraction.
    }
  }

  return sources.flatMap(extractLogoUrls)
}

async function collectWithPlaywright() {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })

  try {
    const page = await browser.newPage()
    const responseUrls = new Set<string>()

    page.on('response', (response) => {
      responseUrls.add(response.url())
    })

    await page.goto(siteUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })
    await page.waitForTimeout(8_000)

    try {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(2_000)
    } catch {
      // The page may block scripted scrolling; initial resources are still useful.
    }

    const content = await page.content()
    const pageUrls = await page.evaluate(() => {
      const fromElements = Array.from(
        document.querySelectorAll<HTMLImageElement | HTMLScriptElement | HTMLLinkElement>(
          'img[src], script[src], link[href], source[srcset]'
        )
      ).flatMap((element) => {
        const src = element.getAttribute('src')
        const href = element.getAttribute('href')
        const srcset = element.getAttribute('srcset')

        return [src, href, srcset]
          .filter(Boolean)
          .flatMap((value) => String(value).split(',').map((item) => item.trim().split(/\s+/)[0]))
      })

      const fromPerformance = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)

      return [...fromElements, ...fromPerformance]
    })

    return [
      ...extractLogoUrls(content),
      ...pageUrls.flatMap((url) => extractLogoUrls(url)),
      ...[...responseUrls].flatMap((url) => extractLogoUrls(url)),
    ]
  } finally {
    await browser.close()
  }
}

function createCandidates(urls: string[]): LogoCandidate[] {
  const uniqueUrls = [...new Set(urls.map(normalizeUrl))]

  return uniqueUrls
    .map((url) => {
      const fileName = getFileName(url)

      return {
        url,
        fileName,
        normalizedName: normalizeName(fileName),
      }
    })
    .filter((candidate) => candidate.normalizedName)
}

function scoreCandidate(company: Company, candidate: LogoCandidate) {
  const companyNames = normalizeVariants(company.name)
  const fileNames = normalizeVariants(candidate.fileName)
  const companyTokens = tokens(company.name)
  const fileTokens = tokens(candidate.fileName)

  if (companyNames.length === 0 || fileNames.length === 0) {
    return { score: 0, method: 'none' }
  }

  for (const companyName of companyNames) {
    for (const fileName of fileNames) {
      if (fileName === companyName || compact(fileName) === compact(companyName)) {
        return { score: 100, method: 'exact' }
      }

      if (
        companyName.length > 4 &&
        fileName.length > 4 &&
        (fileName.includes(companyName) ||
          companyName.includes(fileName) ||
          compact(fileName).includes(compact(companyName)) ||
          compact(companyName).includes(compact(fileName)))
      ) {
        return { score: 92, method: 'exact-ish' }
      }
    }
  }

  const longestCompanyToken = companyTokens
    .sort((a, b) => b.length - a.length)[0]

  if (
    longestCompanyToken &&
    longestCompanyToken.length > 4 &&
    fileNames.some((fileName) => fileName.includes(longestCompanyToken) || compact(fileName).includes(longestCompanyToken))
  ) {
    return { score: 78, method: 'partial' }
  }

  const matchingTokens = companyTokens.filter((token) =>
    fileTokens.some((fileToken) => tokensMatch(token, fileToken))
  )

  if (matchingTokens.length >= 2) {
    return {
      score: 65 + Math.min(20, matchingTokens.join('').length),
      method: 'token',
    }
  }

  if (matchingTokens.length === 1) {
    const token = matchingTokens[0]

    return {
      score: token.length >= 7 ? 62 : 45,
      method: 'token',
    }
  }

  return { score: 0, method: 'none' }
}

function findBestMatch(company: Company, candidates: LogoCandidate[]) {
  return candidates
    .map((candidate) => ({
      candidate,
      ...scoreCandidate(company, candidate),
    }))
    .filter((match) => match.score >= 60)
    .sort((a, b) => b.score - a.score)[0]
}

function isReliableLocalMatch(
  company: Company,
  match: ReturnType<typeof findBestMatch> | undefined
) {
  if (!match) {
    return false
  }

  if (match.score === 100 && match.method === 'exact') {
    return true
  }

  return match.score >= 92 &&
    match.method === 'exact-ish' &&
    tokens(company.name).length >= 2
}

async function main() {
  const companies = JSON.parse(
    await fs.readFile(companiesPath, 'utf8')
  ) as CompanyWithLogo[]

  console.log('Fetching logo candidates from beersochi.ru...')
  let urls = await collectWithFetch()
  console.log(`Fetch candidates: ${urls.length}`)

  if (urls.length === 0) {
    console.log('No logos found in static HTML/assets, falling back to Playwright...')
    urls = await collectWithPlaywright()
    console.log(`Playwright candidates: ${urls.length}`)
  }

  const candidates = createCandidates(urls)
  const localCandidates = await collectLocalLogoCandidates()
  const matches: LogoMatch[] = []
  const missing: string[] = []
  const failedDownloads: Array<{
    company: string
    logoSource: string
    error: string
  }> = []
  let downloaded = 0
  let skippedExisting = 0

  const updatedCompanies: CompanyWithLogo[] = []

  for (const company of companies) {
    const existingLocalLogo = company.logo && !company.logo.startsWith('http')

    if (existingLocalLogo) {
      const localFilePath = path.join(
        logoDirectory,
        company.logo.replace(`${publicLogoDirectory}/`, '')
      )

      if (await fileExists(localFilePath)) {
        const existingLocalMatch = findBestMatch(company, [
          {
            url: company.logo,
            fileName: path.basename(company.logo),
            normalizedName: normalizeName(path.basename(company.logo)),
          },
        ])

        if (!company.logoSource && !isReliableLocalMatch(company, existingLocalMatch)) {
          missing.push(company.name)
          updatedCompanies.push({
            ...company,
            logo: null,
            logoSource: null,
          })
          continue
        }

        skippedExisting += 1
        matches.push({
          company: company.name,
          logo: company.logo,
          logoSource: company.logoSource ?? null,
          score: 100,
          method: 'existing',
        })

        updatedCompanies.push({
          ...company,
          logoSource: company.logoSource ?? null,
        })
        continue
      }

      if (!company.logoSource) {
        missing.push(company.name)
        updatedCompanies.push({
          ...company,
          logo: null,
          logoSource: null,
        })
        continue
      }
    }

    const localMatch = findBestMatch(company, localCandidates)

    if (!company.logo && isReliableLocalMatch(company, localMatch)) {
      skippedExisting += 1
      matches.push({
        company: company.name,
        logo: localMatch.candidate.url,
        logoSource: null,
        score: localMatch.score,
        method: `local-${localMatch.method}`,
      })
      updatedCompanies.push({
        ...company,
        logo: localMatch.candidate.url,
        logoSource: null,
      })
      continue
    }

    const logoSource = company.logo?.startsWith('http')
      ? company.logo
      : company.logoSource ?? findBestMatch(company, candidates)?.candidate.url

    if (!logoSource) {
      missing.push(company.name)
      updatedCompanies.push({
        ...company,
        logo: null,
        logoSource: null,
      })
      continue
    }

    const match = findBestMatch(company, candidates)
    const score = company.logo?.startsWith('http')
      ? 100
      : match?.score ?? 0
    const method = company.logo?.startsWith('http')
      ? 'existing-source'
      : match?.method ?? 'matched'

    try {
      const downloadedLogo = await downloadLogo(company.name, logoSource)

      if (downloadedLogo.skippedExisting) {
        skippedExisting += 1
      } else {
        downloaded += 1
      }

      matches.push({
        company: company.name,
        logo: downloadedLogo.logo,
        logoSource,
        score,
        method,
      })

      updatedCompanies.push({
        ...company,
        logo: downloadedLogo.logo,
        logoSource,
      })
    } catch (error) {
      failedDownloads.push({
        company: company.name,
        logoSource,
        error: error instanceof Error ? error.message : String(error),
      })
      missing.push(company.name)
      updatedCompanies.push({
        ...company,
        logo: null,
        logoSource: null,
      })
    }
  }

  const report = {
    totalCompanies: updatedCompanies.length,
    foundLogos: matches.length,
    missingLogos: missing.length,
    downloaded,
    skippedExisting,
    failedDownloads,
    totalCandidates: candidates.length,
    totalLocalCandidates: localCandidates.length,
    candidates,
    localCandidates,
    matches,
    missing,
  }

  await fs.writeFile(
    companiesPath,
    `${JSON.stringify(updatedCompanies, null, 2)}\n`
  )
  await fs.writeFile(
    reportPath,
    `${JSON.stringify(report, null, 2)}\n`
  )

  console.log(
    `Done. Found ${matches.length}/${updatedCompanies.length} logos. Missing: ${missing.length}.`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
