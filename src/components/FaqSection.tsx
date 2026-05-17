'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import faqItems from '@/data/faq.json'
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
  answer: string
  link?: string
  linkLabel?: string
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/ё/g, 'е')
}

export default function FaqSection() {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeSearch(query)

    if (!normalizedQuery) {
      return faqItems as FaqItem[]
    }

    return (faqItems as FaqItem[]).filter((item) =>
      normalizeSearch(`${item.question} ${item.answer}`).includes(normalizedQuery)
    )
  }, [query])

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

                {isOpen && (
                  <div className="space-y-3 px-4 pb-4 text-sm leading-6 text-[#8A654F]">
                    <p className="whitespace-pre-line">{item.answer}</p>
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
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
