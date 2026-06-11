import { Classification } from '../../screens/ClassificationScreen'

export type Sj311FieldHints = {
  description: string[]
  location: string[]
  email: string[]
  phone: string[]
  firstName: string[]
  lastName: string[]
  publicView: string[]
  graffitiSurface: string[]
  vehicleConcern: string[]
  vehicleCondition: string[]
}

export type Sj311ServiceDefinition = {
  portalLabel: string
  serviceCode: string
  entryUrl: string
  searchTerms: string[]
  fieldHints: Sj311FieldHints
  mapTagToGraffitiSurface?: (tag: string) => string | null
  mapTagToVehicleConcern?: (tag: string) => string | null
}

export type Sj311Reporter = {
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
}

export type Sj311FormPayload = {
  serviceKey: string
  portalLabel: string
  serviceCode: string
  entryUrl: string
  searchTerms: string[]
  fieldHints: Sj311FieldHints
  category: string
  tag: string
  description: string
  locationMain: string
  locationSub: string
  fullAddress: string
  latitude: number | null
  longitude: number | null
  reporter: Sj311Reporter
  graffitiSurface: string | null
  vehicleConcern: string | null
  vehicleCondition: string | null
  photoUploadSupported: false
  photoNote: string
  submittedAt: string
}

export type Sj311PrepareResponse = {
  ok: boolean
  mode: 'webview_autofill' | 'log'
  portalUrl: string
  payload: Sj311FormPayload
  autofillScript: string
  instructions: string[]
}

export type Sj311SubmitOutcome =
  | 'submitted'
  | 'cancelled'
  | 'needs_confirmation'
  | 'portal_opened'

export type Sj311SubmitRequest = {
  classification: Classification
  reporter?: Sj311Reporter
}
