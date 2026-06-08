import * as Location from 'expo-location'

export type DetectedReportLocation = {
  locationMain: string
  locationSub: string
  latitude: number
  longitude: number
}

const FALLBACK_LOCATION: DetectedReportLocation = {
  locationMain: 'San Jose City Hall',
  locationSub: 'San Jose, CA 95110',
  latitude: 37.3371,
  longitude: -121.8863,
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

export const detectReportLocation = async (): Promise<DetectedReportLocation> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      return FALLBACK_LOCATION
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
    return FALLBACK_LOCATION
  }
}
