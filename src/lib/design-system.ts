export const radius = {
  cardRadius: 'rounded-3xl',
  inputRadius: 'rounded-2xl',
  buttonRadius: 'rounded-2xl',
  badgeRadius: 'rounded-full',
} as const

export const shadows = {
  cardShadow: 'shadow-sm',
} as const

export const brand = {
  brandBrown: '#7A3F1D',
  brandDarkBrown: '#4A2412',
  brandAmber: '#F7941D',
  brandAmberSoft: '#FFF4E6',
  brandBackground: '#FAF6EF',
  brandSurface: '#FFFDF8',
} as const

export const brandClasses = {
  textBrown: 'text-[#7A3F1D]',
  textDarkBrown: 'text-[#4A2412]',
  textAmber: 'text-[#F7941D]',
  textMuted: 'text-[#8A654F]',
  textSoft: 'text-[#A7795F]',
  bgBrown: 'bg-[#7A3F1D]',
  bgDarkBrown: 'bg-[#4A2412]',
  bgAmber: 'bg-[#F7941D]',
  bgAmberSoft: 'bg-[#FFF4E6]',
  bgBackground: 'bg-[#FAF6EF]',
  bgSurface: 'bg-[#FFFDF8]',
  borderWarm: 'border-[#7A3F1D]/15',
  borderAmber: 'border-[#F7941D]/30',
} as const

export const borders = {
  borderDefault: `border ${brandClasses.borderWarm}`,
} as const

export const surfaces = {
  surfacePrimary: brandClasses.bgSurface,
  surfaceSecondary: brandClasses.bgAmberSoft,
} as const

export const textColors = {
  textPrimary: brandClasses.textDarkBrown,
  textSecondary: brandClasses.textMuted,
  textMuted: brandClasses.textSoft,
} as const

export const spacing = {
  p3: 'p-3',
  p4: 'p-4',
  p5: 'p-5',
  gap2: 'gap-2',
  gap3: 'gap-3',
  gap4: 'gap-4',
  spaceY3: 'space-y-3',
  spaceY4: 'space-y-4',
} as const

export const cardClassName = [
  radius.cardRadius,
  borders.borderDefault,
  surfaces.surfacePrimary,
  shadows.cardShadow,
].join(' ')

export const inputClassName = [
  'h-11',
  radius.inputRadius,
  borders.borderDefault,
  surfaces.surfacePrimary,
  'px-4',
  'text-base',
  shadows.cardShadow,
].join(' ')

export const sectionHeader = {
  eyebrow:
    'text-xs tracking-[0.3em] uppercase text-[#7A3F1D] font-medium',
  title: 'text-4xl font-bold tracking-tight text-[#4A2412]',
  subtitle: 'text-lg text-[#8A654F] leading-relaxed',
} as const

export function cn(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(' ')
}
