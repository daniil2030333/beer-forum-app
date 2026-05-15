import fs from 'fs'

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
  }))

fs.writeFileSync(
  'src/data/companies.json',
  JSON.stringify(companies, null, 2)
)

console.log(
  `Built ${companies.length} companies`
)
