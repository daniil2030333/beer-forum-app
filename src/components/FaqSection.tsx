'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import faqItems from '@/data/faq.json'
import { beerFaqItems, type BeerFaqSection } from '@/data/faq-beer'
import {
  borders,
  cardClassName,
  cn,
  radius,
  surfaces,
} from '@/lib/design-system'

type FaqItem = {
  id: string
  question: string
  answer?: string
  link?: string
  linkLabel?: string
  sections?: BeerFaqSection[]
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/ё/g, 'е')
}

function getSearchText(item: FaqItem) {
  const sectionText = (item.sections || [])
    .map((section) =>
      [
        section.title,
        section.body,
        ...(section.items || []),
      ]
        .filter(Boolean)
        .join(' ')
    )
    .join(' ')

  return `${item.question} ${item.answer || ''} ${sectionText}`
}

function BeerFaqContent({
  sections,
}: {
  sections: BeerFaqSection[]
}) {
  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div
          key={section.title}
          className={cn(
            radius.inputRadius,
            'border border-[#7A3F1D]/10 bg-[#FFFDF8] p-3'
          )}
        >
          <h3 className="text-sm font-semibold leading-snug text-[#4A2412]">
            {section.title}
          </h3>
          {section.body && (
            <p className="mt-1.5 text-sm leading-[1.65] text-[#8A654F]">
              {section.body}
            </p>
          )}
          {section.items && (
            <ul className="mt-2 space-y-1.5 text-sm leading-[1.6] text-[#8A654F]">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#F7941D]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

export default function FaqSection() {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const allItems = useMemo<FaqItem[]>(
    () => [...(faqItems as FaqItem[]), ...beerFaqItems],
    []
  )

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeSearch(query)

    if (!normalizedQuery) {
      return allItems
    }

    return allItems.filter((item) =>
      normalizeSearch(getSearchText(item)).includes(normalizedQuery)
    )
  }, [allItems, query])

  return (
    <section className={cn(cardClassName, 'space-y-3 p-4')}>
      <div>
        <h2 className="text-2xl font-semibold tracking-normal text-[#4A2412]">
          FAQ
        </h2>
        <p className="mt-1 text-sm leading-5 text-[#8A654F]">
          Ответы на частые вопросы о Форуме.
        </p>
      </div>

      <label className="relative block">
        <span className="sr-only">Поиск по FAQ</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A7795F]"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по вопросам"
          className={cn(
            radius.inputRadius,
            borders.borderDefault,
            surfaces.surfacePrimary,
            'h-11 w-full px-4 pl-11 text-base shadow-sm outline-none'
          )}
        />
      </label>

      {filteredItems.length === 0 ? (
        <div className={cn(radius.inputRadius, surfaces.surfaceSecondary, 'p-4 text-center text-sm font-medium text-[#8A654F]')}>
          Ничего не найдено
        </div>
      ) : (
        <div className="divide-y divide-[#7A3F1D]/10 overflow-hidden rounded-3xl border border-[#7A3F1D]/15 bg-[#FFFDF8]">
          {filteredItems.map((item) => {
            const isOpen = openId === item.id

            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-[#4A2412] transition-colors hover:bg-[#FFF4E6]"
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0 break-words">{item.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'h-5 w-5 shrink-0 text-[#A7795F] transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>

                <div
                  className={cn(
                    'grid transition-all duration-200',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="space-y-3 px-4 pb-4 text-sm leading-6 text-[#8A654F]">
                      {item.answer && (
                        <p className="whitespace-pre-line leading-[1.65]">{item.answer}</p>
                      )}
                      {item.sections && <BeerFaqContent sections={item.sections} />}
                      {item.link && item.linkLabel && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            radius.buttonRadius,
                            'inline-flex h-10 items-center justify-center bg-[#4A2412] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7A3F1D]'
                          )}
                        >
                          {item.linkLabel}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
