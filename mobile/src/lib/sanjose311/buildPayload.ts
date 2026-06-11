import { Classification } from '../../screens/ClassificationScreen'
import { getSj311Service } from './serviceCatalog'
import { Sj311FormPayload, Sj311Reporter } from './types'

const PHOTO_NOTE =
  'Photo upload is not available from CityFix. Add a photo manually on the San José 311 form before submitting.'

export const buildSj311FormPayload = (
  classification: Classification,
  reporter: Sj311Reporter = {},
): Sj311FormPayload => {
  const service = getSj311Service(classification.category)
  const fullAddress = [classification.locationMain, classification.locationSub]
    .filter(Boolean)
    .join(', ')

  const description = [
    classification.desc.trim(),
    '',
    `Issue type: ${classification.tag}`,
    `Reported via CityFix`,
    classification.latitude != null && classification.longitude != null
      ? `Coordinates: ${classification.latitude.toFixed(6)}, ${classification.longitude.toFixed(6)}`
      : null,
    '',
    PHOTO_NOTE,
  ]
    .filter((line) => line != null)
    .join('\n')

  return {
    serviceKey: classification.category,
    portalLabel: service.portalLabel,
    serviceCode: service.serviceCode,
    entryUrl: service.entryUrl,
    searchTerms: service.searchTerms,
    fieldHints: service.fieldHints,
    category: classification.category,
    tag: classification.tag,
    description,
    locationMain: classification.locationMain,
    locationSub: classification.locationSub,
    fullAddress,
    latitude: classification.latitude ?? null,
    longitude: classification.longitude ?? null,
    reporter: {
      email: reporter.email ?? null,
      firstName: reporter.firstName ?? null,
      lastName: reporter.lastName ?? null,
      phone: reporter.phone ?? null,
    },
    graffitiSurface: service.mapTagToGraffitiSurface?.(classification.tag) ?? null,
    vehicleConcern: service.mapTagToVehicleConcern?.(classification.tag) ?? null,
    vehicleCondition: null,
    photoUploadSupported: false,
    photoNote: PHOTO_NOTE,
    submittedAt: new Date().toISOString(),
  }
}
