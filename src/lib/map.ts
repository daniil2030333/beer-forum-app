import companies from '@/data/companies.json'
import mapStands from '@/data/map-stands.json'
import type { Company } from '@/lib/types/company'

export type MapStand = {
  stand: string
  x: number
  y: number
  width?: number
  height?: number
}

export type InteractiveMapStand = MapStand & {
  company: Company | null
  companies: Company[]
  coordinates: MapStand
  clickable: boolean
}

function normalizeStand(value?: string | null) {
  if (!value) {
    return null
  }

  const normalized = value.trim()
  if (!normalized || normalized === '-' || normalized === '—') {
    return null
  }

  const match = normalized.match(/\d+/)
  return match?.[0] ?? null
}

export function getCompaniesByStand(stand: string): Company[] {
  const normalizedStand = normalizeStand(stand)
  if (!normalizedStand) {
    return []
  }

  return (companies as Company[]).filter(
    (company) => normalizeStand(company.stand) === normalizedStand
  )
}

export function getCompanyByStand(stand: string): Company | undefined {
  return getCompaniesByStand(stand)[0]
}

export function getStandByCompany(companyId: string): MapStand | undefined {
  const company = (companies as Company[]).find(
    (item) => String(item.id) === String(companyId)
  )
  const stand = normalizeStand(company?.stand)

  if (!stand) {
    return undefined
  }

  return (mapStands as MapStand[]).find((item) => item.stand === stand)
}

export function getInteractiveMapStands(): InteractiveMapStand[] {
  return (mapStands as MapStand[]).map((stand) => {
    const standCompanies = getCompaniesByStand(stand.stand)

    return {
      ...stand,
      company: standCompanies[0] ?? null,
      companies: standCompanies,
      coordinates: stand,
      clickable: standCompanies.length > 0,
    }
  })
}
