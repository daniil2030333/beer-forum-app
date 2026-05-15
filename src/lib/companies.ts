import type { Company } from '@/lib/types/company'

export type ExpoCompany = Company & {
  stand?: string
  hasStand: boolean
  location: string
  searchableText: string
}

export type SortOrder = 'default' | 'alpha' | 'stand'

export function normalizeStand(value: Company['stand']): string | undefined {
  if (value == null) {
    return undefined
  }

  const normalized = String(value).trim()
  if (!normalized || normalized === '-' || normalized === '—' || normalized.toLowerCase() === 'null') {
    return undefined
  }

  return normalized
}

export function normalizeText(value?: string): string | undefined {
  return value?.trim() || undefined
}

export function normalizeCompany(company: Company): ExpoCompany {
  const stand = normalizeStand(company.stand)
  const city = normalizeText(company.city)
  const country = normalizeText(company.country)
  const description = normalizeText(company.description)
  const name = normalizeText(company.name) ?? ''
  const location = [city, country].filter(Boolean).join(', ')
  const searchableText = [name, city, country, description, stand]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return {
    ...company,
    name,
    city,
    country,
    stand,
    description,
    hasStand: Boolean(stand),
    location,
    searchableText,
  }
}

export function normalizeCompanies(companies: Company[]): ExpoCompany[] {
  const seen = new Set<string>()

  return companies
    .map(normalizeCompany)
    .filter((company) => {
      if (seen.has(company.id)) {
        return false
      }

      seen.add(company.id)
      return true
    })
}

function parseStandNumber(stand?: string): number {
  if (!stand) {
    return Infinity
  }

  const match = stand.match(/\d+/)
  return match ? parseInt(match[0], 10) : Infinity
}

function sortByAlphabet(companies: ExpoCompany[]) {
  return [...companies].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

function sortByStand(companies: ExpoCompany[]) {
  return [...companies].sort((a, b) => {
    const aNum = parseStandNumber(a.stand)
    const bNum = parseStandNumber(b.stand)
    return aNum - bNum
  })
}

function sortByDefault(companies: ExpoCompany[]) {
  const withStand = companies.filter((c) => c.hasStand)
  const withoutStand = companies.filter((c) => !c.hasStand)

  return [
    ...sortByAlphabet(withStand),
    ...sortByAlphabet(withoutStand),
  ]
}

export function sortCompanies(
  companies: ExpoCompany[],
  order: SortOrder = 'default'
): ExpoCompany[] {
  switch (order) {
    case 'alpha':
      return sortByAlphabet(companies)
    case 'stand':
      return sortByStand(companies)
    case 'default':
    default:
      return sortByDefault(companies)
  }
}

export function getCompanyById(companies: Company[], id: string): ExpoCompany | undefined {
  return normalizeCompanies(companies).find((company) => String(company.id) === id)
}

export function getCompanyStats(companies: Company[]) {
  const normalized = normalizeCompanies(companies)
  const withStand = normalized.filter((company) => company.hasStand)
  const countries = new Set(normalized.filter((company) => company.country).map((company) => company.country))

  return {
    total: normalized.length,
    withStand: withStand.length,
    countryCount: countries.size,
  }
}
