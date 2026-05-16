import companies from '@/data/companies.json'
import type { Company } from '@/lib/types/company'
import { getCompanyById } from '@/lib/companies'
import { getStandByCompany } from '@/lib/map'
import {
  borders,
  cardClassName,
  cn,
  radius,
} from '@/lib/design-system'
import Link from 'next/link'

type Props = {
  params: Promise<{
    id: string
  }>
}

function getCompanyInitials(name: string) {
  return name
    .replace(/[«»"']/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export function generateStaticParams() {
  return (companies as Company[])
    .map((company) => ({ id: String(company.id) }))
}

export default async function CompanyPage({ params }: Props) {
  const { id } = await params
  const company = getCompanyById(companies as Company[], id)

  if (!company) {
    return (
      <main className="min-h-screen bg-[#FAF6EF] p-4 pb-24">
        <div className={cn(cardClassName, 'mx-auto max-w-3xl p-5')}>
          <p className="text-base text-[#8A654F]">Компания не найдена.</p>
          <Link
            href="/companies"
            className={cn('mt-4 inline-flex h-11 items-center bg-[#FFFDF8] px-4 text-sm font-semibold text-[#7A3F1D] shadow-sm', radius.buttonRadius, borders.borderDefault)}
          >
            Вернуться к каталогу
          </Link>
        </div>
      </main>
    )
  }

  const mapStand = getStandByCompany(company.id)
  const hasDescription = Boolean(company.description?.trim())

  return (
    <main className="min-h-screen bg-[#FAF6EF] p-4 pb-24">
      <div className="mx-auto max-w-3xl space-y-3">
        <Link
          href="/companies"
          className={cn('inline-flex h-10 items-center bg-[#FFFDF8] px-4 text-sm font-semibold text-[#7A3F1D] shadow-sm transition-colors hover:bg-[#FAF6EF]', radius.buttonRadius, borders.borderDefault)}
        >
          ← Назад к Expo
        </Link>

        <section className={cn(cardClassName, 'p-5')}>
          <div className="flex min-w-0 gap-4">
            <div
              className={cn(
                'flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden bg-[#FFF8EC] text-base font-semibold text-[#5A321E]',
                radius.inputRadius
              )}
            >
              {company.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span>{getCompanyInitials(company.name) || 'EX'}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A7795F]">
                Экспонент
              </p>
              <h1 className="mt-2 break-words text-2xl font-bold leading-tight tracking-tight text-[#4A2412] sm:text-3xl">
                {company.name}
              </h1>
              <p className="mt-2 text-sm leading-5 text-[#8A654F]">
                {company.location || 'Город и страна не указаны'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {company.hasStand ? (
                  <div className="inline-flex rounded-full border border-[#F7941D]/30 bg-[#FFF4E6] px-3 py-1 text-sm font-medium text-[#7A3F1D]">
                    Стенд {company.stand}
                  </div>
                ) : null}
                {company.partnerStatus ? (
                  <div className="inline-flex rounded-full border border-[#F7941D]/30 bg-[#FFF4E6] px-3 py-1 text-sm font-medium text-[#7A3F1D]">
                    {company.partnerStatus}
                  </div>
                ) : null}
                {mapStand ? (
                  <Link
                    href={`/map?stand=${mapStand.stand}`}
                    className={cn('inline-flex h-8 items-center justify-center bg-[#4A2412] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#7A3F1D]', radius.buttonRadius)}
                  >
                    Показать на карте
                  </Link>
                ) : null}
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className={cn('inline-flex h-8 items-center justify-center bg-[#FFFDF8] px-3 text-sm font-semibold text-[#7A3F1D] transition-colors hover:bg-[#FFF4E6]', radius.buttonRadius, borders.borderDefault)}
                  >
                    Сайт компании
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className={cn(cardClassName, 'p-5')}>
          <h2 className="text-xl font-semibold leading-tight text-[#4A2412]">О компании</h2>
          <p className="mt-4 text-base leading-relaxed text-[#8A654F]">
            {hasDescription ? company.description : 'Описание компании пока не указано.'}
          </p>
        </section>
      </div>
    </main>
  )
}
