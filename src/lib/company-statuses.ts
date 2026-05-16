import type { Company } from '@/lib/types/company'

export const infoPartnerStatus = 'Информационный партнёр'

export const forumPartnerStatuses = {
  official: 'Официальный партнёр',
  general: 'Генеральный партнёр',
  registration: 'Партнёр регистрации',
  generalInfo: 'Генеральный информационный партнёр',
  evening: 'Партнёр вечернего приёма',
  forum: 'Партнёр Форума',
} as const

type ExpectedStatus = {
  label: string
  status: string
  matcher: (normalizedName: string) => boolean
}

export function normalizeCompanyNameForStatus(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/&/g, ' ')
    .replace(/[«»"'`’‘“”„.,()]/g, ' ')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasAllWords(normalizedName: string, words: string[]) {
  return words.every((word) => normalizedName.includes(word))
}

export const expectedInfoPartners: ExpectedStatus[] = [
  {
    label: 'Краспиво',
    status: infoPartnerStatus,
    matcher: (name) => name.includes('kraspivo') || name.includes('краспиво'),
  },
  {
    label: 'Бизнес пищевых ингредиентов',
    status: infoPartnerStatus,
    matcher: (name) => hasAllWords(name, ['бизнес', 'пищевых', 'ингредиентов']),
  },
  {
    label: 'Кто есть Кто. ПИЩЕПРОМ + АПК России',
    status: infoPartnerStatus,
    matcher: (name) => hasAllWords(name, ['кто', 'есть', 'кто', 'пищепром', 'апк']),
  },
  {
    label: 'РБК-ЮГ',
    status: infoPartnerStatus,
    matcher: (name) => name.includes('рбк') && name.includes('юг'),
  },
  {
    label: 'РЕСТОРАНОВЕД',
    status: infoPartnerStatus,
    matcher: (name) => name.includes('ресторановед'),
  },
  {
    label: 'Российский продовольственный рынок',
    status: infoPartnerStatus,
    matcher: (name) => hasAllWords(name, ['российский', 'продовольственный', 'рынок']),
  },
  {
    label: 'Издательский дом «СФЕРА»',
    status: infoPartnerStatus,
    matcher: (name) => name.includes('сфера') && name.includes('издательский'),
  },
  {
    label: 'ProfiBeer',
    status: infoPartnerStatus,
    matcher: (name) => name.includes('profibeer'),
  },
  {
    label: 'RealBrew',
    status: infoPartnerStatus,
    matcher: (name) => name.includes('realbrew'),
  },
  {
    label: 'Индустрия Напитков',
    status: infoPartnerStatus,
    matcher: (name) => hasAllWords(name, ['индустрия', 'напитков']),
  },
  {
    label: 'Алко PRO',
    status: infoPartnerStatus,
    matcher: (name) => (name.includes('алко') || name.includes('alko')) && name.includes('pro'),
  },
]

export const expectedForumPartners: ExpectedStatus[] = [
  {
    label: 'Союз российских пивоваров',
    status: forumPartnerStatuses.official,
    matcher: (name) => hasAllWords(name, ['союз', 'российских', 'пивоваров']),
  },
  {
    label: 'Грейнрус',
    status: forumPartnerStatuses.general,
    matcher: (name) => name.includes('грейнрус'),
  },
  {
    label: 'Сыктывкарпиво',
    status: forumPartnerStatuses.registration,
    matcher: (name) => name.includes('сыктывкарский') || name.includes('сыктывкарпиво'),
  },
  {
    label: 'Издательство пищевая промышленность / Журнал "Пиво и Напитки"',
    status: forumPartnerStatuses.generalInfo,
    matcher: (name) => hasAllWords(name, ['пищевая', 'промышленность']),
  },
  {
    label: 'Томское пиво',
    status: forumPartnerStatuses.evening,
    matcher: (name) => hasAllWords(name, ['томское', 'пиво']),
  },
  {
    label: 'Дарьял',
    status: forumPartnerStatuses.forum,
    matcher: (name) => name.includes('дарьял'),
  },
  {
    label: 'Хадыженский пивоваренный завод',
    status: forumPartnerStatuses.forum,
    matcher: (name) => name.includes('хадыженский'),
  },
]

export const expectedCompanyStatuses = [
  ...expectedForumPartners,
  ...expectedInfoPartners,
]

export function getPartnerStatus(companyName: string) {
  const normalizedName = normalizeCompanyNameForStatus(companyName)
  const match = expectedCompanyStatuses.find((expected) => expected.matcher(normalizedName))

  return match?.status ?? null
}

export function buildCompanyStatusReport(companies: Company[]) {
  const companiesWithStatus = companies.filter((company) => company.partnerStatus)
  const infoPartners = companiesWithStatus
    .filter((company) => company.partnerStatus === infoPartnerStatus)
    .map((company) => company.name)
    .sort((first, second) => first.localeCompare(second, 'ru'))
  const forumPartners = companiesWithStatus
    .filter((company) => company.partnerStatus !== infoPartnerStatus)
    .map((company) => ({
      name: company.name,
      status: company.partnerStatus,
    }))
    .sort((first, second) => first.name.localeCompare(second.name, 'ru'))
  const missingExpectedStatuses = expectedCompanyStatuses
    .filter((expected) => !companies.some((company) => {
      const normalizedName = normalizeCompanyNameForStatus(company.name)
      return expected.matcher(normalizedName) && company.partnerStatus === expected.status
    }))
    .map((expected) => expected.label)
  const unexpectedStatuses = companiesWithStatus
    .filter((company) => getPartnerStatus(company.name) !== company.partnerStatus)
    .map((company) => ({
      name: company.name,
      status: company.partnerStatus,
    }))

  return {
    infoPartners,
    forumPartners,
    withoutStatus: companies.filter((company) => !company.partnerStatus).length,
    missingExpectedStatuses,
    unexpectedStatuses,
  }
}
