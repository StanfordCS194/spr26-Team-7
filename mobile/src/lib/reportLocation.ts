import * as Location from 'expo-location'
import { DISTRICT_NEIGHBORHOODS } from '../data/dashboardMockData'
import { DISTRICT_CENTERS } from '../data/mockMapReports'

export type DetectedReportLocation = {
  locationMain: string
  locationSub: string
  latitude: number
  longitude: number
}

const homeDistrictFallback = (homeDistrict: number): DetectedReportLocation => {
  const district = homeDistrict >= 1 && homeDistrict <= 10 ? homeDistrict : 3
  const center = DISTRICT_CENTERS[district] ?? DISTRICT_CENTERS[3]
  const neighborhoods = DISTRICT_NEIGHBORHOODS[district] ?? DISTRICT_NEIGHBORHOODS[3]

  return {
    locationMain: `District ${district}`,
    locationSub: `${neighborhoods} · San Jose, CA`,
    latitude: center.latitude,
    longitude: center.longitude,
  }
}

export const formatReportDateTime = (date: Date) =>
  date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

export const detectReportLocation = async (
  options: { locationEnabled?: boolean; homeDistrict?: number } = {},
): Promise<DetectedReportLocation> => {
  const homeDistrict = options.homeDistrict ?? 3

  if (options.locationEnabled === false) {
    return homeDistrictFallback(homeDistrict)
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      return homeDistrictFallback(homeDistrict)
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    const results = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    })

    const place = results[0]
    if (!place) {
      return {
        locationMain: 'Current location',
        locationSub: 'San Jose, CA',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
    }

    const street = [place.streetNumber, place.street].filter(Boolean).join(' ')
    const city = place.city ?? 'San Jose'
    const region = place.region ?? 'CA'
    const postal = place.postalCode ?? ''

    return {
      locationMain: street || place.name || place.district || 'Current location',
      locationSub: [city, region, postal].filter(Boolean).join(', '),
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }
  } catch {
    return homeDistrictFallback(homeDistrict)
  }
}
