import companies from '@/data/companies.json'
import type { Company } from '@/lib/types/company'
import { getCompanyById } from '@/lib/companies'
import { getStandByCompany } from '@/lib/map'
import {
  borders,
  cardClassName,
  cn,
  radius,
  sectionHeader,
  surfaces,
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

  return (
    <main className="min-h-screen bg-[#FAF6EF] p-4 pb-24">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/companies"
              className={cn('inline-flex h-10 items-center bg-[#FFFDF8] px-4 text-sm font-semibold text-[#7A3F1D] shadow-sm transition-colors hover:bg-[#FAF6EF]', radius.buttonRadius, borders.borderDefault)}
            >
              ← Назад к Expo
            </Link>
          </div>
        </div>

        <section className={cn(cardClassName, 'p-5')}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div
                className={cn(
                  'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-white text-base font-semibold text-[#5A321E]',
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

              <div className="min-w-0">
                <p className={sectionHeader.eyebrow}>
                  Экспонент
                </p>
                <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#4A2412]">
                  {company.name}
                </h1>
                <p className="mt-3 text-lg leading-relaxed text-[#8A654F]">
                  {company.location || 'Город и страна не указаны'}
                </p>
              </div>
            </div>

            {company.hasStand ? (
              <div className={cn(radius.badgeRadius, 'whitespace-nowrap bg-[#FFF4E6] px-3 py-1 text-sm font-medium text-[#5A321E]')}>
                Стенд {company.stand}
              </div>
            ) : (
              <div className={cn(radius.badgeRadius, surfaces.surfaceSecondary, 'px-3 py-1 text-sm font-medium text-[#5A321E]')}>
                Стенд не указан
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className={cn(radius.cardRadius, borders.borderDefault, surfaces.surfaceSecondary, 'p-4')}>
              <p className="text-sm font-semibold text-[#A7795F]">Город</p>
              <p className="mt-2 text-base font-medium text-[#4A2412]">{company.city || '—'}</p>
            </div>

            <div className={cn(radius.cardRadius, borders.borderDefault, surfaces.surfaceSecondary, 'p-4')}>
              <p className="text-sm font-semibold text-[#A7795F]">Страна</p>
              <p className="mt-2 text-base font-medium text-[#4A2412]">{company.country || '—'}</p>
            </div>
          </div>
        </section>

        <section className={cn(cardClassName, 'p-5')}>
          <h2 className="text-xl font-semibold leading-tight text-[#4A2412]">О компании</h2>
          <p className="mt-4 text-base leading-relaxed text-[#8A654F]">
            {company.description || 'Полное описание пока не добавлено.'}
          </p>
        </section>

        <section className={cn(cardClassName, 'p-5')}>
          <h2 className="text-xl font-semibold leading-tight text-[#4A2412]">Действия</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {mapStand ? (
              <Link
                href={`/map?stand=${mapStand.stand}`}
                className={cn('inline-flex h-11 items-center justify-center bg-[#4A2412] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7A3F1D]', radius.buttonRadius)}
              >
                Показать на карте
              </Link>
            ) : (
              <button
                type="button"
                className={cn('inline-flex h-11 items-center justify-center bg-[#FFF4E6] px-4 text-sm font-semibold text-[#8A654F]', radius.buttonRadius)}
                disabled
              >
                {company.hasStand ? 'Стенд не найден на карте' : 'Стенд не указан'}
              </button>
            )}

            <button
              type="button"
              className={cn('inline-flex h-11 items-center justify-center bg-[#FFFDF8] px-4 text-sm font-semibold text-[#4A2412] transition-colors hover:bg-[#FAF6EF]', radius.buttonRadius, borders.borderDefault)}
            >
              Добавить в избранное
            </button>
          </div>
          <p className="mt-3 text-sm text-[#A7795F]">
            Кнопка сохранения пока работает как заглушка — позже можно подключить избранное.
          </p>
        </section>
      </div>
    </main>
  )
}
