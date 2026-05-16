export interface Company {
  id: string
  name: string
  city?: string
  country?: string
  stand?: string
  description?: string
  logo: string | null
  logoSource?: string | null
  partnerStatus: string | null
  website?: string | null
}
