import type { Company } from '@/lib/types/company'

export function buildCompanyWebsitesReport(companies: Company[]) {
  const companiesWithoutWebsite = companies
    .filter((company) => !company.website)
    .map((company) => company.name)
    .sort((first, second) => first.localeCompare(second, 'ru'))

  return {
    totalCompanies: companies.length,
    withWebsite: companies.length - companiesWithoutWebsite.length,
    withoutWebsite: companiesWithoutWebsite.length,
    companiesWithoutWebsite,
  }
}
