import { Sj311ServiceDefinition } from './types'

const BASE_URL = process.env.EXPO_PUBLIC_SJ311_PORTAL_URL ?? 'https://311.sanjoseca.gov/'

const DEFAULT_FIELD_HINTS = {
  description: ['tell us more', 'description', 'details', 'comments', 'issue description'],
  location: ['location', 'address', 'where', 'street', 'place'],
  email: ['email', 'e-mail'],
  phone: ['phone', 'mobile', 'contact number'],
  firstName: ['first name', 'given name'],
  lastName: ['last name', 'family name', 'surname'],
  publicView: ['public', 'visible', 'view report'],
  graffitiSurface: ['on:', 'surface', 'painted wall', 'graffiti on'],
  vehicleConcern: ['vehicle concern', 'what vehicle concern', 'concern are you reporting'],
  vehicleCondition: ['qualifying conditions', 'describes the problem', 'condition'],
}

const catalog: Record<string, Sj311ServiceDefinition> = {
  Pothole: {
    portalLabel: 'Pothole',
    serviceCode: 'pothole',
    entryUrl: BASE_URL,
    searchTerms: ['pothole', 'cracked pavement', 'damaged sidewalk', 'broken curb', 'uneven surface'],
    fieldHints: DEFAULT_FIELD_HINTS,
  },
  'Streetlight Outage': {
    portalLabel: 'Streetlight Outage',
    serviceCode: 'streetlight-outage',
    entryUrl: BASE_URL,
    searchTerms: ['streetlight', 'light out', 'broken fixture', 'flickering', 'downed pole'],
    fieldHints: DEFAULT_FIELD_HINTS,
  },
  Graffiti: {
    portalLabel: 'Graffiti',
    serviceCode: 'graffiti',
    entryUrl: BASE_URL,
    searchTerms: ['graffiti', 'vandalism', 'tagging'],
    fieldHints: DEFAULT_FIELD_HINTS,
    mapTagToGraffitiSurface: (tag) => {
      const map: Record<string, string> = {
        'Public Property': 'Painted wall',
        'Private Property': 'Unpainted wall',
        'Park Facility': 'Park Restroom Building',
        'Underpass / Bridge': 'Other',
      }
      return map[tag] ?? 'Other'
    },
  },
  'Illegal Dumping': {
    portalLabel: 'Illegal Dumping',
    serviceCode: 'illegal-dumping',
    entryUrl: BASE_URL,
    searchTerms: ['illegal dumping', 'dumping', 'bulk waste', 'debris'],
    fieldHints: DEFAULT_FIELD_HINTS,
  },
  'Vehicle Concerns': {
    portalLabel: 'Vehicle Concerns',
    serviceCode: 'vehicle-concerns',
    entryUrl: BASE_URL,
    searchTerms: ['vehicle', 'abandoned vehicle', 'parked vehicle'],
    fieldHints: DEFAULT_FIELD_HINTS,
    mapTagToVehicleConcern: (tag) => {
      const map: Record<string, string> = {
        'Abandoned Vehicle': 'Poor condition of a vehicle parked on a city street',
        'Illegally Parked': 'Issue with how, where or how long a vehicle is parked on a city street',
        'Stolen Vehicle': 'Suspected vehicle-related criminal activity (drugs or prostitution)',
        'Vehicle Parts': 'Trash/sewage around a vehicle (not inside the vehicle or on the truck bed)',
      }
      return map[tag] ?? 'Poor condition of a vehicle parked on a city street'
    },
  },
  'Encampment Concerns': {
    portalLabel: 'Encampment Concerns',
    serviceCode: 'encampment',
    entryUrl: BASE_URL,
    searchTerms: ['encampment', 'homeless encampment', 'camp'],
    fieldHints: DEFAULT_FIELD_HINTS,
  },
}

export const getSj311Service = (category: string): Sj311ServiceDefinition => {
  const service = catalog[category]
  if (service) {
    return service
  }

  return {
    portalLabel: category,
    serviceCode: category.toLowerCase().replace(/\s+/g, '-'),
    entryUrl: BASE_URL,
    searchTerms: [category.toLowerCase()],
    fieldHints: DEFAULT_FIELD_HINTS,
  }
}

export const SJ311_PORTAL_BASE_URL = BASE_URL
