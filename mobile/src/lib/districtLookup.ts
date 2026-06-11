import { DISTRICT_CENTERS } from '../data/mockMapReports'

export const lookupDistrictFromCoordinates = (lat: number, lon: number): number => {
  let nearestDistrict = 3
  let minDistance = Number.POSITIVE_INFINITY

  for (const [districtKey, center] of Object.entries(DISTRICT_CENTERS)) {
    const dLat = lat - center.latitude
    const dLon = lon - center.longitude
    const distance = dLat * dLat + dLon * dLon
    if (distance < minDistance) {
      minDistance = distance
      nearestDistrict = Number(districtKey)
    }
  }

  return nearestDistrict
}

export const formatDistrictLabel = (district: number): string =>
  `San Jose District ${district}`
