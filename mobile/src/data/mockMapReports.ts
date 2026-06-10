// Types and config for map reports. Seed data lives in Supabase — run scripts/seedReports.js.

export type MapReportStatus = 'Submitted' | 'Open' | 'In Progress' | 'Closed'

export type MapReportCategoryId =
  | 'pothole'
  | 'streetlight'
  | 'graffiti'
  | 'dumping'
  | 'vehicle'
  | 'container'
  | 'encampment'
  | 'junk'

export type MapReport = {
  id:          string
  categoryId:  MapReportCategoryId
  title:       string
  address:     string
  district:    number
  lat:         number
  lon:         number
  status:      MapReportStatus
  createdAt:   Date
  description: string
  assignedTo:  string
  timeline:    { label: string; dateText: string; reached?: boolean }[]
}

// Category display config — icon names from @expo/vector-icons MaterialCommunityIcons
export type CategoryConfig = {
  id:    MapReportCategoryId
  label: string
  icon:  string   // MaterialCommunityIcons name
  color: string
}

export const CATEGORY_CONFIG: Record<MapReportCategoryId, CategoryConfig> = {
  pothole:     { id: 'pothole',     label: 'Pothole',           icon: 'road-variant',          color: '#C89838' },
  streetlight: { id: 'streetlight', label: 'Streetlight',       icon: 'lightbulb-on-outline',  color: '#B8B030' },
  graffiti:    { id: 'graffiti',    label: 'Graffiti',          icon: 'format-paint',          color: '#B05898' },
  dumping:     { id: 'dumping',     label: 'Illegal Dumping',   icon: 'trash-can-outline',     color: '#C04830' },
  vehicle:     { id: 'vehicle',     label: 'Vehicle Concerns',  icon: 'car',                   color: '#6855C0' },
  container:   { id: 'container',   label: 'Container Issues',  icon: 'package-variant',       color: '#38B078' },
  encampment:  { id: 'encampment',  label: 'Encampment',        icon: 'tent',                  color: '#38A8B8' },
  junk:        { id: 'junk',        label: 'Junk Pickup',       icon: 'delete-sweep-outline',  color: '#4A8CB5' },
}

export const ALL_CATEGORY_IDS = Object.keys(CATEGORY_CONFIG) as MapReportCategoryId[]

// District centers for map initial region
export const DISTRICT_CENTERS: Record<number, { latitude: number; longitude: number }> = {
  1:  { latitude: 37.270, longitude: -121.840 },
  2:  { latitude: 37.302, longitude: -121.893 },
  3:  { latitude: 37.338, longitude: -121.886 },
  4:  { latitude: 37.362, longitude: -121.843 },
  5:  { latitude: 37.407, longitude: -121.875 },
  6:  { latitude: 37.330, longitude: -121.872 },
  7:  { latitude: 37.315, longitude: -121.774 },
  8:  { latitude: 37.263, longitude: -121.840 },
  9:  { latitude: 37.322, longitude: -121.950 },
  10: { latitude: 37.422, longitude: -121.918 },
}
