export type Rol = 'ZORGVRAGER' | 'ZORGVERLENER' | 'BEHEER'
export type VraagStatus = 'OPEN' | 'GEKOPPELD' | 'AFGEROND' | 'GEANNULEERD'
export type MatchStatus = 'VOORGESTELD' | 'BEVESTIGD' | 'AFGEROND'
export type BetalingStatus = 'OPEN' | 'BETAALD' | 'MISLUKT' | 'TERUGBETAALD'
export type DocumentStatus = 'IN_BEHANDELING' | 'GOEDGEKEURD' | 'AFGEKEURD'
export type ReviewStatus = 'INGEDIEND' | 'ZICHTBAAR' | 'GEMELD' | 'VERBORGEN'
export type Mobiliteit = 'ZELFSTANDIG' | 'ROLLATOR' | 'ROLSTOEL' | 'BEDLEGERIG'
export type ReanimatieStatus = 'JA' | 'NEE' | 'ONBEKEND'
export type ToegangsMethode = 'SLEUTELKLUIS' | 'AANWEZIG_BIJ_AANKOMST' | 'MANTELZORGER' | 'ANDERS'

export interface Gebruiker {
  id: string
  email: string
  rol: Rol
  naam: string
  telefoon?: string
  adres?: string
  stad?: string
  lat?: number
  lng?: number
  aangemeld_op: string
  actief: boolean
}

export interface ZorgverlenerProfiel {
  id: string
  gebruiker_id: string
  big_registratie?: string
  kvk_nummer?: string
  zorgtypes: string[]
  werkgebied_km: number
  uurtarief?: number
  bio?: string
  goedgekeurd: boolean
  goedgekeurd_op?: string
  goedgekeurd_door?: string
  afwijzing_reden?: string
  document_status: DocumentStatus
  gebruiker?: Gebruiker
}

export interface Document {
  id: string
  gebruiker_id: string
  type: 'VOG' | 'BIG' | 'DIPLOMA' | 'KVK' | 'OVERIG'
  naam: string
  url: string
  geupload_op: string
  geverifieerd: boolean
}

export interface Zorgvraag {
  id: string
  zorgvrager_id: string
  zorgtype: string
  omschrijving: string
  indicatiebedrag: number
  uren_per_week?: number
  startdatum?: string
  status: VraagStatus
  lat: number
  lng: number
  stad: string
  adres: string
  aangemaakt_op: string
  zorgvrager?: Gebruiker
  match?: Match
}

export interface Match {
  id: string
  zorgvraag_id: string
  zorgverlener_id: string
  status: MatchStatus
  reactie_tekst?: string
  aangemaakt_op: string
  bevestigd_op?: string
  zorgverlener?: Gebruiker
  zorgvraag?: Zorgvraag
  betaling?: Betaling
}

export interface Betaling {
  id: string
  match_id: string
  bedrag: number
  commissie: number
  mollie_id?: string
  status: BetalingStatus
  aangemaakt_op: string
}

export interface AuditLog {
  id: string
  gebruiker_id: string
  actie: string
  data: Record<string, unknown>
  ip?: string
  timestamp: string
}

// Scores per reviewer_rol
export interface ReviewScoresZorgverlener {
  professionaliteit: number   // 1-5
  communicatie: number        // 1-5
  punctualiteit: number       // 1-5
  vertrouwen: number          // 1-5
}

export interface ReviewScoresZorgvrager {
  duidelijkheid_vraag: number   // 1-5
  respectvolle_omgang: number   // 1-5
  bereikbaarheid: number        // 1-5
}

export interface Review {
  id: string
  match_id: string
  reviewer_id: string
  reviewee_id: string
  reviewer_rol: Rol
  scores: ReviewScoresZorgverlener | ReviewScoresZorgvrager
  tekst?: string
  status: ReviewStatus
  gemeld_door?: string
  gemeld_op?: string
  gemeld_reden?: string
  beheer_besluit?: string
  beheer_besluit_op?: string
  beheer_besluit_door?: string
  aangemaakt_op: string
  reviewer?: Gebruiker
  reviewee?: Gebruiker
}

export interface GemiddeldeScores {
  totaal_reviews: number
  gem_professionaliteit: number
  gem_communicatie: number
  gem_punctualiteit: number
  gem_vertrouwen: number
  gem_totaal: number
}

export interface ZorgvragerProfiel {
  id: string
  gebruiker_id: string

  // Huisdieren
  huisdieren_aanwezig?: boolean
  huisdier_type?: string

  // Gezondheid
  allergieen?: string
  medische_aandachtspunten?: string
  mobiliteit?: Mobiliteit

  // Wilsverklaring
  // Uitsluitend ter informatie voor de zorgverlener.
  // ZorgMatch draagt geen medische verantwoordelijkheid.
  reanimatie?: ReanimatieStatus
  dnr_aanwezig?: boolean

  // Noodinformatie
  noodmedicatie_aanwezig?: boolean
  noodmedicatie_toelichting?: string

  // Noodcontact
  noodcontact_naam?: string
  noodcontact_telefoon?: string

  // Toegang (geen codes opslaan)
  toegang_methode?: ToegangsMethode
  toegang_toelichting?: string

  created_at: string
  updated_at: string
}

export const ZORGTYPES = [
  { value: 'persoonlijke_verzorging', label: 'Persoonlijke verzorging' },
  { value: 'verpleging', label: 'Verpleging' },
  { value: 'begeleiding', label: 'Begeleiding' },
  { value: 'huishoudelijke_hulp', label: 'Huishoudelijke hulp' },
  { value: 'dagbesteding', label: 'Dagbesteding' },
  { value: 'nachtzorg', label: 'Nachtzorg' },
  { value: 'respijtzorg', label: 'Respijtzorg' },
  { value: 'geestelijke_gezondheidszorg', label: 'Geestelijke gezondheidszorg' },
]

export const COMMISSIE_PERCENTAGE = 0.10 // 10% commissie
