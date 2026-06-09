import { IssueCategory } from '../types'

export type RouteCandidate = {
  category: string
  confidence: number
}

export type RouterResult = {
  top_category: string
  confidence: number
  alternatives: RouteCandidate[]
}

// Mirrors ml/schemas.py PipelineResponse.
export type PipelineResponse = {
  router: RouterResult
  category: string
  extraction: Record<string, unknown>
  description: string
}

// The pipeline's 8 categories collapsed onto the 6 mobile IssueCategory values.
// fireworks/sewer have no dedicated mobile category, so they fall back to the
// closest department-aligned bucket.
const CATEGORY_TO_ISSUE: Record<string, IssueCategory> = {
  pothole: 'Pothole',
  streetlight: 'Streetlight Outage',
  graffiti: 'Graffiti',
  dumping: 'Illegal Dumping',
  vehicle: 'Vehicle Concerns',
  encampment: 'Encampment Concerns',
  fireworks: 'Illegal Dumping',
  sewer: 'Pothole',
}

const STREETLIGHT_TAG: Record<string, string> = {
  outage: 'Light Out',
  flickering: 'Flickering Light',
  damaged_fixture: 'Broken Fixture',
  leaning_pole: 'Downed Pole',
  exposed_wiring: 'Broken Fixture',
}

const DUMPING_TAG: Record<string, string> = {
  household_trash: 'Household Items',
  construction_debris: 'Construction Debris',
  furniture: 'Bulk Waste',
  electronics: 'Hazardous Material',
  yard_waste: 'Bulk Waste',
  mixed_debris: 'Bulk Waste',
}

const VEHICLE_TAG: Record<string, string> = {
  lived_in: 'Abandoned Vehicle',
  poor_condition: 'Abandoned Vehicle',
  trash_sewage: 'Abandoned Vehicle',
  parking_violation: 'Illegally Parked',
  private_property: 'Illegally Parked',
  park_creek: 'Illegally Parked',
  criminal_activity: 'Stolen Vehicle',
}

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

const deriveTag = (response: PipelineResponse, category: IssueCategory): string => {
  const ex = response.extraction
  switch (response.category) {
    case 'streetlight':
      return STREETLIGHT_TAG[asString(ex.issue_type)] ?? 'Light Out'
    case 'graffiti':
      return ex.appears_on_public_property ? 'Public Property' : 'Private Property'
    case 'dumping':
    case 'fireworks':
      return DUMPING_TAG[asString(ex.material_type)] ?? 'Bulk Waste'
    case 'vehicle':
      return VEHICLE_TAG[asString(ex.concern_type)] ?? 'Abandoned Vehicle'
    case 'encampment':
      return 'Public Property'
    case 'pothole':
    case 'sewer':
    default:
      return category
  }
}

export type MlClassification = {
  category: IssueCategory
  tag: string
  desc: string
  raw: PipelineResponse
}

export const toMlClassification = (response: PipelineResponse): MlClassification => {
  const category = CATEGORY_TO_ISSUE[response.category] ?? 'Pothole'
  return {
    category,
    tag: deriveTag(response, category),
    desc: response.description,
    raw: response,
  }
}
