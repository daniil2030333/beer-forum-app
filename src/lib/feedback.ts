export const feedbackStorageKey = 'beerforum-feedback'

export type FeedbackItem = {
  id: string
  role: 'participant'
  fullName: string
  company: string
  text: string
  createdAt: string
}

function readFeedbackItems() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawItems = window.localStorage.getItem(feedbackStorageKey)
    const parsedItems = rawItems ? JSON.parse(rawItems) : []

    return Array.isArray(parsedItems) ? parsedItems : []
  } catch {
    return []
  }
}

export function getFeedbackItems(): FeedbackItem[] {
  return readFeedbackItems().filter((item): item is FeedbackItem => {
    return (
      typeof item?.id === 'string' &&
      item.role === 'participant' &&
      typeof item.fullName === 'string' &&
      typeof item.company === 'string' &&
      typeof item.text === 'string' &&
      typeof item.createdAt === 'string'
    )
  })
}

export function saveFeedback(feedback: FeedbackItem) {
  if (typeof window === 'undefined') {
    return
  }

  const items = getFeedbackItems()
  window.localStorage.setItem(
    feedbackStorageKey,
    JSON.stringify([feedback, ...items])
  )
}
