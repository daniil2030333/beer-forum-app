'use client'

import { useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { REVIEW_LINKS } from '@/lib/constants/links'
import { saveFeedback } from '@/lib/feedback'
import { useUserRole } from '@/lib/use-user-role'
import {
  borders,
  cardClassName,
  cn,
  radius,
  surfaces,
} from '@/lib/design-system'

function createFeedbackId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `feedback-${Date.now()}`
}

function ReviewLinkButton({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  if (!href) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          radius.buttonRadius,
          'inline-flex h-11 w-full items-center justify-center px-4 text-sm font-semibold',
          'border border-[#7A3F1D]/15 bg-[#F1E7DA] text-[#8A654F]'
        )}
        title="Ссылка будет добавлена позже"
      >
        Ссылка будет добавлена позже
      </button>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        radius.buttonRadius,
        'inline-flex h-11 w-full items-center justify-center gap-2 bg-[#FFF4E6] px-4 text-sm font-semibold text-[#4A2412] transition-colors hover:bg-[#FFE7C2]',
        borders.borderDefault
      )}
    >
      <MessageSquare size={17} aria-hidden="true" />
      {children}
    </a>
  )
}

function ReviewButtons() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <ReviewLinkButton href={REVIEW_LINKS.yandex}>
        Оставить отзыв на Яндекс.Картах
      </ReviewLinkButton>
      <ReviewLinkButton href={REVIEW_LINKS.twoGis}>
        Оставить отзыв в 2ГИС
      </ReviewLinkButton>
    </div>
  )
}

export default function FeedbackSection() {
  const { role } = useUserRole()
  const currentRole = role || 'visitor'
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedFullName = fullName.trim()
    const trimmedCompany = company.trim()
    const trimmedText = text.trim()

    if (!trimmedFullName) {
      setError('Укажите имя и фамилию.')
      setSuccessMessage('')
      return
    }

    if (!trimmedCompany) {
      setError('Укажите компанию.')
      setSuccessMessage('')
      return
    }

    if (trimmedText.length < 5) {
      setError('Напишите отзыв длиной от 5 символов.')
      setSuccessMessage('')
      return
    }

    saveFeedback({
      id: createFeedbackId(),
      role: 'participant',
      fullName: trimmedFullName,
      company: trimmedCompany,
      text: trimmedText,
      createdAt: new Date().toISOString(),
    })

    setFullName('')
    setCompany('')
    setText('')
    setError('')
    setSuccessMessage('Спасибо! Ваш отзыв сохранён.')
  }

  return (
    <section className={cn(cardClassName, 'space-y-4 p-4')}>
      <div>
        <h2 className="text-2xl font-semibold tracking-normal text-[#4A2412]">
          Отзыв
        </h2>
        <p className="mt-1 text-sm leading-5 text-[#8A654F]">
          Поделитесь впечатлением о Форуме.
        </p>
      </div>

      {currentRole === 'participant' && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#4A2412]">
              Имя и фамилия
            </span>
            <input
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value)
                setError('')
              }}
              className={cn(
                radius.inputRadius,
                borders.borderDefault,
                surfaces.surfacePrimary,
                'h-11 w-full px-4 text-base shadow-sm outline-none'
              )}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#4A2412]">
              Компания
            </span>
            <input
              value={company}
              onChange={(event) => {
                setCompany(event.target.value)
                setError('')
              }}
              className={cn(
                radius.inputRadius,
                borders.borderDefault,
                surfaces.surfacePrimary,
                'h-11 w-full px-4 text-base shadow-sm outline-none'
              )}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#4A2412]">
              Текст отзыва
            </span>
            <textarea
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setError('')
              }}
              placeholder="Ваш отзыв"
              rows={4}
              className={cn(
                radius.inputRadius,
                borders.borderDefault,
                surfaces.surfacePrimary,
                'w-full resize-none px-4 py-3 text-base leading-6 shadow-sm outline-none'
              )}
            />
          </label>

          {error && (
            <p className="text-sm font-medium text-red-700">{error}</p>
          )}

          {successMessage && (
            <p className={cn(radius.inputRadius, surfaces.surfaceSecondary, 'px-3 py-2 text-sm font-medium text-[#4A2412]')}>
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            className={cn(
              radius.buttonRadius,
              'inline-flex h-11 w-full items-center justify-center gap-2 bg-[#4A2412] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7A3F1D]'
            )}
          >
            <Send size={18} aria-hidden="true" />
            Сохранить отзыв
          </button>
        </form>
      )}

      <ReviewButtons />
    </section>
  )
}
