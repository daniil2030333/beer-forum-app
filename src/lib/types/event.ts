export type { Company } from '@/lib/types/company'

export type ProgramEventType =
  | 'сессия'
  | 'мастер-класс'
  | 'презентация'
  | 'пресс-конференция'
  | 'круглый стол'
  | 'требуется приглашение'

export interface Event {
  id: string
  day?: string
  date?: string
  time?: string
  title: string
  subtitle?: string
  description?: string
  eventType?: ProgramEventType | null
  location?: string
  hall?: string
  speakers?: string[]
}
