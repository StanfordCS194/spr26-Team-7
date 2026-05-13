// Mock report pins used by the dashboard map.
// All coordinates are real streets inside the respective San Jose council districts.

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
  timeline:    { label: string; dateText: string }[]
}

// Category display config — icon names from @expo/vector-icons MaterialCommunityIcons
export type CategoryConfig = {
  id:    MapReportCategoryId
  label: string
  icon:  string   // MaterialCommunityIcons name
  color: string
}

export const CATEGORY_CONFIG: Record<MapReportCategoryId, CategoryConfig> = {
  pothole:     { id: 'pothole',     label: 'Pothole',           icon: 'road-variant',          color: '#E8514A' },
  streetlight: { id: 'streetlight', label: 'Streetlight',       icon: 'lightbulb-on-outline',  color: '#5B9BF8' },
  graffiti:    { id: 'graffiti',    label: 'Graffiti',          icon: 'format-paint',          color: '#3ECF82' },
  dumping:     { id: 'dumping',     label: 'Illegal Dumping',   icon: 'trash-can-outline',     color: '#F0A030' },
  vehicle:     { id: 'vehicle',     label: 'Vehicle Concerns',  icon: 'car',                   color: '#E8514A' },
  container:   { id: 'container',   label: 'Container Issues',  icon: 'package-variant',       color: '#F0A030' },
  encampment:  { id: 'encampment',  label: 'Encampment',        icon: 'tent',                  color: '#A78BFA' },
  junk:        { id: 'junk',        label: 'Junk Pickup',       icon: 'delete-sweep-outline',  color: '#F0A030' },
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

export const MOCK_MAP_REPORTS: MapReport[] = [
  // ── 3 days ago — 4 reports ─────────────────────────────────────────────────
  {
    id:          'GC-2026-05421',
    categoryId:  'dumping',
    title:       'Illegal Dumping at 4th & Santa Clara',
    address:     '4th St & Santa Clara St, San Jose, CA 95112',
    district:    3,
    lat:         37.3384,
    lon:         -121.8866,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - (3 * 24 * 60 + 22 * 60 + 46) * 60_000),
    description: 'Multiple garbage bags and construction debris dumped at the northeast corner. Blocking partial sidewalk access.',
    assignedTo:  'Environmental Services',
    timeline: [
      { label: 'Submitted',   dateText: 'May 10, 2026 at 8:14 AM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
  },
  {
    id:          'GC-2026-05422',
    categoryId:  'graffiti',
    title:       'Graffiti on Market & Post',
    address:     'Market St & Post St, San Jose, CA 95113',
    district:    3,
    lat:         37.3366,
    lon:         -121.8912,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - (3 * 24 * 60 + 20 * 60 + 13) * 60_000),
    description: 'Large spray-paint tagging on a concrete retaining wall, approximately 15 feet wide. Contains offensive language.',
    assignedTo:  'Parks & Recreation Dept.',
    timeline: [
      { label: 'Submitted',   dateText: 'May 10, 2026 at 10:47 AM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 2–4 hours' },
    ],
  },
  {
    id:          'GC-2026-05423',
    categoryId:  'pothole',
    title:       'Pothole at 7th & Empire',
    address:     'N 7th St & Empire St, San Jose, CA 95112',
    district:    3,
    lat:         37.3368,
    lon:         -121.8805,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - (3 * 24 * 60 + 16 * 60 + 27) * 60_000),
    description: 'Deep pothole in the right travel lane, approximately 18 inches wide. Sharp edge is causing vehicle damage risk.',
    assignedTo:  'Dept. of Transportation',
    timeline: [
      { label: 'Submitted',   dateText: 'May 10, 2026 at 2:33 PM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
  },
  {
    id:          'GC-2026-05424',
    categoryId:  'dumping',
    title:       'Illegal Dumping at S 1st & Reed',
    address:     'S 1st St & Reed St, San Jose, CA 95112',
    district:    3,
    lat:         37.3286,
    lon:         -121.8858,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - (3 * 24 * 60 + 14 * 60 + 9) * 60_000),
    description: 'Old furniture — a couch and two mattresses — left at the curb outside the designated bulky pickup schedule.',
    assignedTo:  'Environmental Services',
    timeline: [
      { label: 'Submitted',   dateText: 'May 10, 2026 at 4:51 PM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
  },

  // ── Yesterday — 5 reports ──────────────────────────────────────────────────
  {
    id:          'GC-2026-05425',
    categoryId:  'pothole',
    title:       'Pothole at Santa Clara & 10th',
    address:     'E Santa Clara St & S 10th St, San Jose, CA 95112',
    district:    3,
    lat:         37.3381,
    lon:         -121.8760,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - (1 * 24 * 60 + 23 * 60 + 38) * 60_000),
    description: 'Series of three connected potholes spanning the bike lane and right travel lane. Cyclists are swerving into traffic.',
    assignedTo:  'Dept. of Transportation',
    timeline: [
      { label: 'Submitted',   dateText: 'May 12, 2026 at 7:22 AM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
  },
  {
    id:          'GC-2026-05426',
    categoryId:  'streetlight',
    title:       'Streetlight Out at N 1st & Saint James',
    address:     'N 1st St & Saint James St, San Jose, CA 95112',
    district:    3,
    lat:         37.3408,
    lon:         -121.8881,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - (1 * 24 * 60 + 21 * 60 + 55) * 60_000),
    description: 'Streetlight has been completely dark for at least 3 nights. Intersection is near a park and poorly lit after sunset.',
    assignedTo:  'Dept. of Public Works',
    timeline: [
      { label: 'Submitted',   dateText: 'May 12, 2026 at 9:05 AM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 10–14 days' },
    ],
  },
  {
    id:          'GC-2026-05427',
    categoryId:  'graffiti',
    title:       'Graffiti on 3rd & Saint James',
    address:     'N 3rd St & Saint James St, San Jose, CA 95112',
    district:    3,
    lat:         37.3406,
    lon:         -121.8873,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - (1 * 24 * 60 + 19 * 60 + 30) * 60_000),
    description: 'Tag marks on the side of a city utility box and the adjacent brick wall. Multiple colors, relatively fresh.',
    assignedTo:  'Parks & Recreation Dept.',
    timeline: [
      { label: 'Submitted',   dateText: 'May 12, 2026 at 11:30 AM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 2–4 hours' },
    ],
  },
  {
    id:          'GC-2026-05428',
    categoryId:  'dumping',
    title:       'Illegal Dumping near San Pedro & Julian',
    address:     'San Pedro St & Julian St, San Jose, CA 95112',
    district:    3,
    lat:         37.3432,
    lon:         -121.8945,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - (1 * 24 * 60 + 15 * 60 + 42) * 60_000),
    description: 'Abandoned household appliances — a washing machine and dryer — left on the sidewalk, partially blocking the curb-cut ramp.',
    assignedTo:  'Environmental Services',
    timeline: [
      { label: 'Submitted',   dateText: 'May 12, 2026 at 3:18 PM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
  },
  {
    id:          'GC-2026-05429',
    categoryId:  'vehicle',
    title:       'Abandoned Vehicle at Almaden & Park',
    address:     'Almaden Blvd & Park Ave, San Jose, CA 95110',
    district:    3,
    lat:         37.3280,
    lon:         -121.8890,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - (1 * 24 * 60 + 12 * 60 + 16) * 60_000),
    description: 'Vehicle with no plates parked for over 72 hours. No registration tag visible on windshield. Possible stolen vehicle.',
    assignedTo:  'San Jose Police Dept.',
    timeline: [
      { label: 'Submitted',   dateText: 'May 12, 2026 at 6:44 PM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
  },

  // ── Today (within last 24h) — 6 reports ────────────────────────────────────
  {
    id:          'GC-2026-05430',
    categoryId:  'pothole',
    title:       'Pothole at 1st & San Fernando',
    address:     'S 1st St & San Fernando St, San Jose, CA 95113',
    district:    3,
    lat:         37.3357,
    lon:         -121.8885,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - 7 * 60 * 60_000),
    description: 'Pothole near the crosswalk, approximately 12 inches in diameter and 3 inches deep. Creates a tripping hazard for pedestrians.',
    assignedTo:  'Dept. of Transportation',
    timeline: [
      { label: 'Submitted',   dateText: 'May 13, 2026 at 7:09 AM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
  },
  {
    id:          'GC-2026-05431',
    categoryId:  'streetlight',
    title:       'Streetlight Out at N Market & Hedding',
    address:     'N Market St & E Hedding St, San Jose, CA 95112',
    district:    3,
    lat:         37.3503,
    lon:         -121.8893,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - 6 * 60 * 60_000),
    description: 'Streetlight pole appears damaged at the base and the light is not functioning. Hazard to nighttime pedestrians and drivers.',
    assignedTo:  'Dept. of Public Works',
    timeline: [
      { label: 'Submitted',   dateText: 'May 13, 2026 at 8:25 AM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 10–14 days' },
    ],
  },
  {
    id:          'GC-2026-05432',
    categoryId:  'graffiti',
    title:       'Graffiti at W Santa Clara & Delmas',
    address:     'W Santa Clara St & Delmas Ave, San Jose, CA 95126',
    district:    3,
    lat:         37.3370,
    lon:         -121.9005,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - 5 * 60 * 60_000),
    description: "Graffiti on a storefront's roll-up gate and adjacent wall. Business owner reports it appeared overnight.",
    assignedTo:  'Parks & Recreation Dept.',
    timeline: [
      { label: 'Submitted',   dateText: 'May 13, 2026 at 9:42 AM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 2–4 hours' },
    ],
  },
  {
    id:          'GC-2026-05433',
    categoryId:  'dumping',
    title:       'Illegal Dumping at Race & Julian',
    address:     'Race St & W Julian St, San Jose, CA 95126',
    district:    3,
    lat:         37.3445,
    lon:         -121.9008,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - 4 * 60 * 60_000),
    description: 'Cardboard boxes and bags of household waste dumped on the sidewalk next to a vacant lot. Potential pest attraction.',
    assignedTo:  'Environmental Services',
    timeline: [
      { label: 'Submitted',   dateText: 'May 13, 2026 at 10:55 AM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
  },
  {
    id:          'GC-2026-05434',
    categoryId:  'encampment',
    title:       'Encampment at N 4th & William',
    address:     'N 4th St & William St, San Jose, CA 95112',
    district:    3,
    lat:         37.3328,
    lon:         -121.8847,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - 3 * 60 * 60_000),
    description: 'Encampment of approximately 4–5 tents under the freeway overpass. Visible debris and waste around the perimeter of the site.',
    assignedTo:  'Dept. of Housing',
    timeline: [
      { label: 'Submitted',   dateText: 'May 13, 2026 at 11:38 AM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 3–5 days' },
    ],
  },
  {
    id:          'GC-2026-05435',
    categoryId:  'junk',
    title:       'Junk Pickup at Almaden & San Carlos',
    address:     'Almaden Ave & W San Carlos St, San Jose, CA 95128',
    district:    3,
    lat:         37.3274,
    lon:         -121.8925,
    status:      'Submitted',
    createdAt:   new Date(Date.now() - 1 * 60 * 60_000),
    description: 'Pile of old electronics, a broken chair, and miscellaneous junk left at the curb outside of regular scheduled pickup days.',
    assignedTo:  'Environmental Services',
    timeline: [
      { label: 'Submitted',   dateText: 'May 13, 2026 at 2:14 PM' },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 10–15 days' },
    ],
  },
]
