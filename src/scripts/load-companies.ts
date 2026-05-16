import fs from 'fs'
import { parse } from 'csv-parse/sync'
import {
  buildCompanyStatusReport,
  getPartnerStatus,
} from '@/lib/company-statuses'
import { buildCompanyWebsitesReport } from '@/lib/company-websites'

console.log('LOAD COMPANIES STARTED')

type ExistingCompany = {
  id: string
  name: string
  logo?: string | null
  logoSource?: string | null
  website?: string | null
}

function normalizeCompanyName(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"'`’‘“”]/g, ' ')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getExistingCompanyData() {
  if (!fs.existsSync('src/data/companies.json')) {
    return new Map<string, Pick<ExistingCompany, 'logo' | 'logoSource' | 'website'>>()
  }

  const existing = JSON.parse(
    fs.readFileSync('src/data/companies.json', 'utf-8')
  ) as ExistingCompany[]

  return new Map(
    existing.map((company) => [
      normalizeCompanyName(company.name),
      {
        logo: company.logo ?? null,
        logoSource: company.logoSource ?? null,
        website: company.website ?? null,
      },
    ])
  )
}

function cleanCountry(value: string) {
  return value
    .replace(/\n\s*(генеральный|официальный|информационный|партнер|партнёр).*/i, '')
    .trim()
}

async function loadCompanies() {
  const existingCompanies = getExistingCompanyData()
  const url =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRTs4cs9mrN_je3G3Q_5mOnO6Nf8hESIXaEEqRZQD37xuNTPXN3csxRktdkRp71cwnS18qtmXnXsg3c/pub?gid=201169808&single=true&output=csv'

  console.log('FETCHING CSV...')

  const response = await fetch(url)

  const csv = await response.text()

  console.log('CSV LENGTH:', csv.length)

  const records = parse(csv)

  console.log('ROWS:', records.length)

  console.log(
    'FIRST ROW:',
    records[0]
  )

  console.log(
    'FIFTH ROW:',
    records[4]
  )

  const companies = records
    .slice(3)
    .map((row: string[], index: number) => {
      const companyRaw = row[2]
      const description = row[3]
      const stand = row[4]

      if (!companyRaw) {
        return null
      }

      const parts = companyRaw
        .split(',')
        .map((x) => x.trim())
      const name = parts[0] || ''
      const preservedCompany = existingCompanies.get(normalizeCompanyName(name))

      return {
        id: String(index + 1),
        name,
        city: parts[1] || '',
        country: cleanCountry(parts[2] || ''),
        stand: stand || '',
        description: description || '',
        logo: preservedCompany?.logo ?? null,
        logoSource: preservedCompany?.logoSource ?? null,
        partnerStatus: getPartnerStatus(name),
        website: preservedCompany?.website ?? null,
      }
    })
    .filter(Boolean)

  console.log(
    'COMPANIES:',
    companies.slice(0, 5)
  )

  fs.writeFileSync(
    'src/data/companies.json',
    JSON.stringify(
      companies,
      null,
      2
    )
  )

  fs.writeFileSync(
    'src/data/company-status-report.json',
    `${JSON.stringify(buildCompanyStatusReport(companies), null, 2)}\n`
  )

  fs.writeFileSync(
    'src/data/company-websites-report.json',
    `${JSON.stringify(buildCompanyWebsitesReport(companies), null, 2)}\n`
  )

  console.log(
    `Loaded ${companies.length} companies`
  )
}

loadCompanies()
