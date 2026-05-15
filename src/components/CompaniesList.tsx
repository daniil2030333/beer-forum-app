'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import companies from '@/data/companies.json'
import BannerCard from '@/components/ads/BannerCard'
import type { Company } from '@/lib/types/company'
import { getBannerForIndex, getTopBanner } from '@/lib/banners'
import {
  getCompanyStats,
  normalizeCompanies,
  sortCompanies,
  type SortOrder,
} from '@/lib/companies'
import {
  borders,
  cardClassName,
  cn,
  radius,
  surfaces,
  textColors,
} from '@/lib/design-system'

const sortOptions = [
  { label: 'По умолчанию', value: 'default' as SortOrder },
  { label: 'А–Я', value: 'alpha' as SortOrder },
  { label: 'По стенду', value: 'stand' as SortOrder },
]

const nativeControlClassName =
  'h-11 w-full rounded-2xl border border-[#7A3F1D]/15 bg-[#FFFDF8] px-4 text-base shadow-sm'

function getCompanyInitials(name: string) {
  const words = name
    .replace(/[«»"']/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function CompanyLogo({
  logo,
  name,
}: {
  logo?: string | null
  name: string
}) {
  const [failed, setFailed] = useState(false)
  const showLogo = Boolean(logo) && !failed

  return (
    <div
      className={cn(
        'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-white text-base font-semibold text-[#5A321E]',
        radius.inputRadius
      )}
    >
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={name}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{getCompanyInitials(name) || 'EX'}</span>
      )}
    </div>
  )
}

export default function CompaniesList() {
  const [onlyWithStand, setOnlyWithStand] = useState(false)
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')

  const stats = getCompanyStats(companies as Company[])

  const sortedAndFilteredCompanies = useMemo(() => {
    const normalized = normalizeCompanies(companies as Company[])

    const filtered = normalized.filter((company) => {
      if (onlyWithStand && !company.hasStand) {
        return false
      }

      return true
    })

    return sortCompanies(filtered, sortOrder)
  }, [onlyWithStand, sortOrder])

  const resultsLabel = useMemo(() => {
    if (!onlyWithStand) {
      return `${stats.total} компаний`
    }

    return `${sortedAndFilteredCompanies.length} результатов`
  }, [sortedAndFilteredCompanies.length, onlyWithStand, stats.total])
  const topBanner = getTopBanner('companies-top')
  const companyBanners = useMemo(() => {
    const bannerMap = new Map<number, NonNullable<ReturnType<typeof getBannerForIndex>>>()
    let previousBannerId = topBanner?.id ?? null

    for (let index = 0; index < sortedAndFilteredCompanies.length; index += 1) {
      const banner = getBannerForIndex(
        'companies-feed',
        index,
        previousBannerId ? [previousBannerId] : []
      )

      if (banner) {
        bannerMap.set(index, banner)
        previousBannerId = banner.id
      }
    }

    return bannerMap
  }, [sortedAndFilteredCompanies.length, topBanner?.id])

  return (
    <div className="space-y-4">
      <div className="text-sm text-[#A7795F]">
        {stats.total} компаний · {stats.withStand} стендов · {stats.countryCount}{' '}
        стран
      </div>

      <div className="sticky top-0 z-30 bg-[#FAF6EF]/95 py-1.5">
        <div className={cn(radius.inputRadius, borders.borderDefault, surfaces.surfacePrimary, 'p-3 shadow-sm')}>
          <div className="flex items-center gap-2">
            <label
              className={cn(
                'flex h-11 min-w-0 flex-1 items-center gap-2 px-3 text-sm text-[#5A321E]',
                radius.inputRadius,
                borders.borderDefault,
                surfaces.surfacePrimary,
                'shadow-sm'
              )}
            >
              <input
                type="checkbox"
                checked={onlyWithStand}
                onChange={(event) => setOnlyWithStand(event.target.checked)}
                className="h-4 w-4 shrink-0"
              />
              <span className="truncate">Только со стендом</span>
            </label>

            <label className="w-40 shrink-0 sm:w-52">
              <span className="sr-only">Сортировка</span>
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as SortOrder)
                }
                className={nativeControlClassName}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-2 text-xs text-[#8A654F]">
            {resultsLabel}
          </div>

        </div>
      </div>

      {topBanner && <BannerCard banner={topBanner} />}

      <div className="grid gap-4 sm:grid-cols-2">
        {sortedAndFilteredCompanies.map((company, index) => {
            const banner = companyBanners.get(index)

            return (
              <Fragment key={company.id}>
                <Link
                  href={`/companies/${company.id}`}
                  className={cn(cardClassName, 'flex h-full flex-col p-3 transition-colors hover:bg-[#FAF6EF] active:bg-[#FFF4E6]')}
                >
                  <div className="flex items-start gap-3">
                    <CompanyLogo logo={company.logo} name={company.name} />

                    <div className="min-w-0 flex-1 space-y-2">
                      <h2 className="break-words text-xl font-semibold leading-tight text-[#4A2412]">
                        {company.name}
                      </h2>
                      <p className={cn('text-sm', textColors.textMuted)}>
                        {company.location || 'Город не указан'}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-5 text-[#8A654F]">
                    {company.description || 'Описание отсутствует.'}
                  </p>

                  <div className="mt-auto pt-3">
                    <div className="inline-flex rounded-full bg-[#FFF4E6] px-3 py-1 text-sm font-medium text-[#4A2412]">
                      {company.hasStand ? `Стенд ${company.stand}` : 'Инфопартнёр'}
                    </div>
                  </div>
                </Link>
                {banner && (
                  <div key={`banner-companies-${index}`} className="mb-2 mt-4 sm:col-span-2">
                    <BannerCard banner={banner} />
                  </div>
                )}
              </Fragment>
            )
          })}
      </div>
    </div>
  )
}
