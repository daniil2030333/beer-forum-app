import fs from 'node:fs/promises'
import path from 'node:path'

import companiesData from '@/data/companies.json'
import type { Company } from '@/lib/types/company'

type CompanyWithLogo = Company & {
  logoSource?: string | null
}

type SuggestedMatch = {
  companyId: string
  companyName: string
  logoFile: string
  score: number
  reason: string
}

type NewlyMatched = SuggestedMatch & {
  previousLogo: string | null
  logo: string
}

type Conflict = SuggestedMatch & {
  currentLogo: string | null
  conflictType: 'existing-logo' | 'duplicate-logo-candidate'
}

type AuditReport = {
  totalFiles: number
  usedFiles: number
  unusedFiles: string[]
  companiesWithoutLogo: string[]
  suggestedMatches: SuggestedMatch[]
  newlyMatched: NewlyMatched[]
  stillWithoutLogo: string[]
  conflicts: Conflict[]
}

const logoDirectory = path.resolve(process.cwd(), 'public/company-logos')
const companiesPath = path.resolve(process.cwd(), 'src/data/companies.json')
const reportPath = path.resolve(process.cwd(), 'src/data/company-logo-audit-report.json')
const publicLogoPrefix = '/company-logos/'
const reliableScore = 0.85

const ignoredWords = new Set([
  'пивоварня',
  'пивоваренный',
  'пивоваренная',
  'завод',
  'компания',
  'компании',
  'группа',
  'ооо',
  'ао',
  'зао',
  'ип',
  'россия',
  'москва',
  'санкт',
  'петербург',
  'spb',
  'rus',
  'russia',
  'company',
  'group',
  'brewery',
  'logo',
])

const equivalentTokenGroups = [
  ['pz', 'пз', 'пивзавод', 'пивоваренный', 'пивоваренная', 'пивоварня'],
]

const translitPairs: Array<[RegExp, string]> = [
  [/shch/g, 'щ'],
  [/sch/g, 'щ'],
  [/yo/g, 'е'],
  [/yu/g, 'ю'],
  [/ya/g, 'я'],
  [/zh/g, 'ж'],
  [/kh/g, 'х'],
  [/ts/g, 'ц'],
  [/ch/g, 'ч'],
  [/sh/g, 'ш'],
  [/ye/g, 'е'],
  [/iy/g, 'ий'],
  [/a/g, 'а'],
  [/b/g, 'б'],
  [/v/g, 'в'],
  [/g/g, 'г'],
  [/d/g, 'д'],
  [/e/g, 'е'],
  [/z/g, 'з'],
  [/i/g, 'и'],
  [/j/g, 'й'],
  [/k/g, 'к'],
  [/l/g, 'л'],
  [/m/g, 'м'],
  [/n/g, 'н'],
  [/o/g, 'о'],
  [/p/g, 'п'],
  [/r/g, 'р'],
  [/s/g, 'с'],
  [/t/g, 'т'],
  [/u/g, 'у'],
  [/f/g, 'ф'],
  [/h/g, 'х'],
  [/c/g, 'к'],
  [/y/g, 'ы'],
  [/x/g, 'кс'],
]

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '')
}

function transliterateLatin(value: string) {
  let result = value.toLowerCase()
  for (const [pattern, replacement] of translitPairs) {
    result = result.replace(pattern, replacement)
  }
  return result
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/&/g, ' and ')
    .replace(/["'«»“”„.,/\\()№]/g, ' ')
    .replace(/[-_+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCompanyName(value: string) {
  return normalize(value)
    .replace(/\b(ооо|ао|зао|ип|ltd|llc|оао|ooo|zao|ao)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string) {
  const normalized = normalizeCompanyName(value)
  const transliterated = normalize(transliterateLatin(normalized))
  const tokens = new Set<string>()

  for (const source of [normalized, transliterated]) {
    source
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length > 1 && !ignoredWords.has(token))
      .forEach((token) => tokens.add(token))
  }

  return [...tokens]
}

function tokensEquivalent(first: string, second: string) {
  if (first === second) {
    return true
  }

  return equivalentTokenGroups.some(
    (group) => group.includes(first) && group.includes(second)
  )
}

function diceCoefficient(first: string, second: string) {
  if (first === second) {
    return 1
  }

  if (first.length < 2 || second.length < 2) {
    return 0
  }

  const firstPairs = new Map<string, number>()
  for (let index = 0; index < first.length - 1; index += 1) {
    const pair = first.slice(index, index + 2)
    firstPairs.set(pair, (firstPairs.get(pair) ?? 0) + 1)
  }

  let intersection = 0
  for (let index = 0; index < second.length - 1; index += 1) {
    const pair = second.slice(index, index + 2)
    const count = firstPairs.get(pair) ?? 0
    if (count > 0) {
      firstPairs.set(pair, count - 1)
      intersection += 1
    }
  }

  return (2 * intersection) / (first.length + second.length - 2)
}

function scoreMatch(fileName: string, companyName: string) {
  const fileBase = stripExtension(fileName)
  const fileTokens = tokenize(fileBase)
  const companyTokens = tokenize(companyName)
  const fileJoined = fileTokens.join('')
  const companyJoined = companyTokens.join('')
  const normalizedFile = normalizeCompanyName(fileBase)
  const normalizedCompany = normalizeCompanyName(companyName)

  if (!fileTokens.length || !companyTokens.length) {
    return { score: 0, reason: 'no comparable tokens' }
  }

  if (normalizedFile === normalizedCompany) {
    return { score: 1, reason: 'normalized exact match' }
  }

  if (
    normalizedFile.length > 3 &&
    normalizedCompany.length > 3 &&
    (normalizedFile.includes(normalizedCompany) ||
      normalizedCompany.includes(normalizedFile))
  ) {
    return { score: 0.94, reason: 'normalized partial match' }
  }

  const exactMatches = fileTokens.filter((token) =>
    companyTokens.some((companyToken) => tokensEquivalent(token, companyToken))
  )
  const exactScore = exactMatches.length / Math.max(fileTokens.length, companyTokens.length)
  const coverageScore = exactMatches.length / Math.min(fileTokens.length, companyTokens.length)
  const fuzzyScore = diceCoefficient(fileJoined, companyJoined)
  const score = Math.max(exactScore, coverageScore * 0.92, fuzzyScore * 0.95)
  const reason = exactMatches.length
    ? `tokens: ${exactMatches.join(', ')}`
    : `fuzzy: ${fuzzyScore.toFixed(2)}`

  return {
    score: Number(score.toFixed(3)),
    reason,
  }
}

function isReliableMatch(match: { score: number; reason: string }) {
  if (match.reason.startsWith('tokens:')) {
    const matchedTokens = match.reason
      .replace(/^tokens:\s*/, '')
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean)
      .filter((token) => !['pz', 'пз'].includes(token))

    return match.score >= 0.45 && matchedTokens.some((token) => token.length > 3)
  }

  if (match.score >= reliableScore) {
    return true
  }

  return false
}

async function main() {
  const companies = (companiesData as CompanyWithLogo[]).map((company) => ({ ...company }))
  const originalLogoByCompanyId = new Map(
    companies.map((company) => [company.id, company.logo ?? null])
  )
  const files = (await fs.readdir(logoDirectory))
    .filter((fileName) => !fileName.startsWith('.') && /\.(png|jpe?g|svg|webp|gif)$/i.test(fileName))
    .sort((first, second) => first.localeCompare(second))
  const fileSet = new Set(files)
  const usedLogoFiles = new Set(
    companies
      .map((company) => company.logo)
      .filter((logo): logo is string => Boolean(logo))
      .map((logo) => path.basename(logo))
      .filter((fileName) => fileSet.has(fileName))
  )
  const unusedFiles = files.filter((fileName) => !usedLogoFiles.has(fileName))
  const companiesWithoutLogo = companies
    .filter((company) => !company.logo)
    .map((company) => company.name)
  const suggestedMatches: SuggestedMatch[] = []
  const newlyMatched: NewlyMatched[] = []
  const conflicts: Conflict[] = []

  const fileBaseGroups = new Map<string, string[]>()
  files.forEach((fileName) => {
    const normalizedBase = normalizeCompanyName(stripExtension(fileName))
    if (!normalizedBase) {
      return
    }

    fileBaseGroups.set(normalizedBase, [
      ...(fileBaseGroups.get(normalizedBase) ?? []),
      fileName,
    ])
  })

  fileBaseGroups.forEach((groupFiles) => {
    if (groupFiles.length <= 1) {
      return
    }

    groupFiles.slice(1).forEach((logoFile) => {
      conflicts.push({
        companyId: '',
        companyName: '',
        logoFile,
        score: 1,
        reason: `duplicate-like logo files: ${groupFiles.join(', ')}`,
        currentLogo: null,
        conflictType: 'duplicate-logo-candidate',
      })
    })
  })

  for (const logoFile of unusedFiles) {
    const candidates = companies
      .filter((company) => !company.logo)
      .map((company) => {
        const match = scoreMatch(logoFile, company.name)
        return {
          company,
          logoFile,
          score: match.score,
          reason: match.reason,
        }
      })
      .filter((match) => match.score >= 0.45)
      .sort((first, second) => second.score - first.score)

    const bestMatch = candidates[0]
    if (!bestMatch) {
      continue
    }

    suggestedMatches.push({
      companyId: bestMatch.company.id,
      companyName: bestMatch.company.name,
      logoFile: bestMatch.logoFile,
      score: bestMatch.score,
      reason: bestMatch.reason,
    })

    if (isReliableMatch(bestMatch)) {
      const previousLogo = originalLogoByCompanyId.get(bestMatch.company.id) ?? null
      bestMatch.company.logo = `${publicLogoPrefix}${bestMatch.logoFile}`
      bestMatch.company.logoSource = `audit:${bestMatch.logoFile}`
      usedLogoFiles.add(bestMatch.logoFile)
      newlyMatched.push({
        companyId: bestMatch.company.id,
        companyName: bestMatch.company.name,
        logoFile: bestMatch.logoFile,
        score: bestMatch.score,
        reason: bestMatch.reason,
        previousLogo,
        logo: `${publicLogoPrefix}${bestMatch.logoFile}`,
      })
      continue
    }

    const companiesWithLogo = companies
      .filter((company) => company.logo)
      .map((company) => {
        const match = scoreMatch(logoFile, company.name)
        return {
          company,
          logoFile,
          score: match.score,
          reason: match.reason,
        }
      })
      .filter((match) => isReliableMatch(match))
      .sort((first, second) => second.score - first.score)

    const existingLogoConflict = companiesWithLogo[0]
    if (existingLogoConflict) {
      conflicts.push({
        companyId: existingLogoConflict.company.id,
        companyName: existingLogoConflict.company.name,
        logoFile,
        score: existingLogoConflict.score,
        reason: existingLogoConflict.reason,
        currentLogo: existingLogoConflict.company.logo ?? null,
        conflictType: 'existing-logo',
      })
    }
  }

  const report: AuditReport = {
    totalFiles: files.length,
    usedFiles: usedLogoFiles.size,
    unusedFiles: files.filter((fileName) => !usedLogoFiles.has(fileName)),
    companiesWithoutLogo: companies
      .filter((company) => !company.logo)
      .map((company) => company.name),
    suggestedMatches: suggestedMatches.sort((first, second) => second.score - first.score),
    newlyMatched,
    stillWithoutLogo: companies
      .filter((company) => !company.logo)
      .map((company) => company.name),
    conflicts: conflicts.sort((first, second) => second.score - first.score),
  }

  await fs.writeFile(companiesPath, `${JSON.stringify(companies, null, 2)}\n`)
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)

  console.info(
    `Logo audit: ${report.usedFiles}/${report.totalFiles} used, ${report.unusedFiles.length} unused, ${report.companiesWithoutLogo.length}/${companiesWithoutLogo.length} companies still without logo.`
  )
  console.info(
    `Suggested matches: ${report.suggestedMatches.length}, applied: ${suggestedMatches.filter((match) => match.score >= reliableScore).length}.`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
