import { useCallback, useEffect, useState } from 'react'
import * as Location from 'expo-location'

export type DeviceLocationReady = {
  status: 'ready'
  latitude: number
  longitude: number
  locationMain: string
  locationSub: string
}

export type DeviceLocationState =
  | { status: 'loading' }
  | { status: 'denied'; message: string }
  | { status: 'error'; message: string }
  | DeviceLocationReady

const formatAddress = (place: Location.LocationGeocodedAddress) => {
  const streetLine = [place.streetNumber, place.street].filter(Boolean).join(' ').trim()
  const locationMain = streetLine || place.name || place.district || 'Current location'

  const cityLine = [place.city ?? place.subregion, place.region]
    .filter(Boolean)
    .join(', ')
  const locationSub = [cityLine, place.postalCode].filter(Boolean).join(' ').trim() || 'San Jose, CA'

  return { locationMain, locationSub }
}

const fetchDeviceLocation = async (): Promise<DeviceLocationState> => {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== Location.PermissionStatus.GRANTED) {
    return {
      status: 'denied',
      message: 'Location access is off. Enable it in Settings to attach your report to your current address.',
    }
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  })

  const { latitude, longitude } = position.coords
  const places = await Location.reverseGeocodeAsync({ latitude, longitude })
  const place = places[0]

  if (!place) {
    return {
      status: 'ready',
      latitude,
      longitude,
      locationMain: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      locationSub: 'GPS coordinates',
    }
  }

  const { locationMain, locationSub } = formatAddress(place)

  return {
    status: 'ready',
    latitude,
    longitude,
    locationMain,
    locationSub,
  }
}

export const useDeviceLocation = () => {
  const [state, setState] = useState<DeviceLocationState>({ status: 'loading' })

  const refresh = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      setState(await fetchDeviceLocation())
    } catch {
      setState({
        status: 'error',
        message: 'Could not get your location. Check GPS signal and try again.',
      })
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}
