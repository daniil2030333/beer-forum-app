import fs from 'fs'
import {
  buildCompanyStatusReport,
  getPartnerStatus,
} from '@/lib/company-statuses'
import { buildCompanyWebsitesReport } from '@/lib/company-websites'

type RawCompany = {
  company?: string
  stand?: string
  city?: string
  description?: string
}

const raw = JSON.parse(
  fs.readFileSync(
    'src/data/companies-raw.json',
    'utf-8'
  )
) as RawCompany[]

const companies = raw
  .filter((row) => row.company)
  .map((row, index) => ({
    id: String(index + 1),
    name: row.company,
    stand: row.stand || '',
    city: row.city || '',
    description: row.description || '',
    logo: '',
    partnerStatus: getPartnerStatus(row.company ?? ''),
    website: null,
  }))

fs.writeFileSync(
  'src/data/companies.json',
  JSON.stringify(companies, null, 2)
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
  `Built ${companies.length} companies`
)
