import banners from '@/data/banners.json'

export type BannerPlacement =
  | 'program'
  | 'companies'
  | 'program-feed'
  | 'companies-feed'
  | 'program-top'
  | 'companies-top'
  | 'me-top'
export type BannerType = 'compact' | 'standard' | 'tall'
export type PartnerLevel = 'general' | 'official' | 'industry' | 'exhibitor'

export type Banner = {
  id: string
  title: string
  placement: BannerPlacement[]
  image: string
  mobileImage?: string
  url?: string
  type: BannerType
  partnerLevel?: PartnerLevel
  weight?: number
  label?: string
  forceDisplay?: boolean
  priority: number
  active: boolean
}

const partnerLevelRank: Record<PartnerLevel, number> = {
  general: 4,
  official: 3,
  industry: 2,
  exhibitor: 1,
}

export const sponsorLabels: Record<PartnerLevel, string> = {
  general: 'Генеральный партнёр',
  official: 'Официальный партнёр',
  industry: 'Отраслевой партнёр',
  exhibitor: 'Партнёр',
}

export function getActiveBanners(placement: BannerPlacement) {
  return (banners as Banner[])
    .filter((banner) => banner.active && banner.placement.includes(placement))
    .sort((a, b) => a.priority - b.priority)
}

export function shouldInsertBanner(index: number) {
  return index >= 0 && (index + 1) % 6 === 0
}

export function getForcedBanner(placement: BannerPlacement) {
  return (banners as Banner[]).find(
    (banner) =>
      banner.active &&
      banner.forceDisplay &&
      banner.placement.includes(placement)
  ) ?? null
}

export function getTopBanner(placement: BannerPlacement) {
  const forcedBanner = getForcedBanner(placement)

  if (forcedBanner) {
    return forcedBanner
  }

  return (banners as Banner[])
    .map((banner, index) => ({ banner, index }))
    .filter(
      ({ banner }) =>
        banner.active &&
        banner.placement.includes(placement)
    )
    .sort((a, b) => {
      const levelDifference =
        (partnerLevelRank[b.banner.partnerLevel ?? 'exhibitor'] ?? 0) -
        (partnerLevelRank[a.banner.partnerLevel ?? 'exhibitor'] ?? 0)

      if (levelDifference !== 0) {
        return levelDifference
      }

      const weightDifference = (b.banner.weight ?? 0) - (a.banner.weight ?? 0)

      if (weightDifference !== 0) {
        return weightDifference
      }

      return a.index - b.index
    })[0]?.banner ?? null
}

export function getBannerForIndex(
  placement: BannerPlacement,
  index: number,
  excludeIds: string[] = []
) {
  if (!shouldInsertBanner(index)) {
    return null
  }

  const activeBanners = getActiveBanners(placement)

  if (activeBanners.length === 0) {
    return null
  }

  const bannerIndex =
    (Math.floor((index + 1) / 6) - 1) % activeBanners.length
  const selectedBanner = activeBanners[bannerIndex]

  if (!excludeIds.includes(selectedBanner.id)) {
    return selectedBanner
  }

  for (let offset = 1; offset < activeBanners.length; offset += 1) {
    const nextBanner = activeBanners[(bannerIndex + offset) % activeBanners.length]

    if (!excludeIds.includes(nextBanner.id)) {
      return nextBanner
    }
  }

  return selectedBanner
}

export function getBannerRotationPreview(
  placement: BannerPlacement,
  slots = 10,
  initialExcludeIds: string[] = []
) {
  const preview: string[] = []
  let previousId = initialExcludeIds[0] ?? null

  for (let slotIndex = 0; slotIndex < slots; slotIndex += 1) {
    const index = (slotIndex + 1) * 6 - 1
    const banner = getBannerForIndex(
      placement,
      index,
      previousId ? [previousId] : []
    )

    if (!banner) {
      break
    }

    preview.push(banner.id)
    previousId = banner.id
  }

  return preview
}

export function getBannerLabel(banner: Banner) {
  return banner.label ?? (banner.partnerLevel ? sponsorLabels[banner.partnerLevel] : 'Партнёр')
}

export function onBannerClick(banner: Pick<Banner, 'id' | 'title' | 'url' | 'placement'>) {
  if (!banner.url) {
    return
  }

  console.info('[banner-click]', {
    bannerId: banner.id,
    title: banner.title,
    url: banner.url,
    placement: banner.placement,
    timestamp: new Date().toISOString(),
  })
}
