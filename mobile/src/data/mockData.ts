import { IssueCategory, ReportDraft, ReportRecord } from '../types'

export const issueCategories: IssueCategory[] = [
  'Pothole',
  'Streetlight Outage',
  'Graffiti',
  'Illegal Dumping',
  'Transit Signage',
]

const categoryGroupMap: Record<IssueCategory, string> = {
  'Pothole': 'Roads & Infrastructure',
  'Streetlight Outage': 'Utilities',
  'Graffiti': 'Public Spaces',
  'Illegal Dumping': 'Public Spaces',
  'Transit Signage': 'Public Transit',
}

export const getCategoryGroup = (category: IssueCategory): string =>
  categoryGroupMap[category] ?? 'Roads & Infrastructure'

const departmentMap: Record<IssueCategory, { name: string; division: string }> = {
  'Pothole': { name: 'Dept. of Transportation', division: 'Street Maintenance · 311' },
  'Streetlight Outage': { name: 'Dept. of Public Works', division: 'Electrical Services · 311' },
  'Graffiti': { name: 'Parks & Recreation Dept.', division: 'Beautification Division · 311' },
  'Illegal Dumping': { name: 'Environmental Services', division: 'Code Enforcement · 311' },
  'Transit Signage': { name: 'Transportation Authority', division: 'Transit Operations · 311' },
}

export const getDepartment = (category: IssueCategory): { name: string; division: string } =>
  departmentMap[category] ?? { name: 'Dept. of Public Works', division: 'General Services · 311' }

export const initialDraft: ReportDraft = {
  photoCount: 1,
  category: 'Pothole',
  description:
    'Significant pothole on Willow St near Lincoln Ave causing road hazard. Approximately 2ft wide with visible asphalt damage.',
  notes: '',
  address: 'Willow St & Lincoln Ave',
  neighborhood: 'Willow Glen',
  duplicateNearby: true,
}

export const dashboardIssues: ReportRecord[] = [
  {
    id: 'GC-2026-04821',
    title: 'Pothole at 4th and Santa Clara',
    category: 'Pothole',
    tag: 'Road hazard',
    district: 'Downtown District',
    status: 'In Progress',
    description:
      'Large pothole in the right lane creating a sharp dip for cars and bikes turning through the intersection.',
    address: '4th St & Santa Clara St, San Jose, CA 95113',
    assignedTo: 'Dept. of Transportation',
    estimatedResolution: 'Estimated 5-7 days based on downtown pothole repairs',
    reportCount: 14,
    isFollowing: true,
    isUserOwned: true,
    photoCount: 2,
    pin: { top: 38, left: 76, color: '#F08B00' },
    timeline: [
      { label: 'Submitted', dateText: 'Apr 22, 2026 at 8:12 AM', reached: true },
      { label: 'Received', dateText: 'Apr 22, 2026 at 9:03 AM', reached: true },
      { label: 'In Progress', dateText: 'Apr 26, 2026 at 2:40 PM', reached: true },
      { label: 'Resolved', dateText: 'Pending', reached: false },
    ],
  },
  {
    id: 'GC-2026-04778',
    title: 'Broken streetlight on Elm and 2nd',
    category: 'Streetlight Outage',
    tag: 'Night visibility',
    district: 'Civic Center District',
    status: 'Received',
    description:
      'Streetlight has been out for three nights, leaving the crosswalk and bus stop corner unlit.',
    address: 'Elm St & 2nd St, San Jose, CA 95112',
    assignedTo: 'Dept. of Public Works',
    estimatedResolution: 'Estimated 2-4 days based on recent utility response times',
    reportCount: 9,
    isFollowing: false,
    isUserOwned: false,
    photoCount: 1,
    pin: { top: 108, left: 148, color: '#0F9CFF' },
    timeline: [
      { label: 'Submitted', dateText: 'Apr 24, 2026 at 6:51 PM', reached: true },
      { label: 'Received', dateText: 'Apr 24, 2026 at 7:25 PM', reached: true },
      { label: 'In Progress', dateText: 'Queued for crew assignment', reached: false },
      { label: 'Resolved', dateText: 'Pending', reached: false },
    ],
  },
  {
    id: 'GC-2026-04691',
    title: 'Illegal dumping near Parkside Lot',
    category: 'Illegal Dumping',
    tag: 'Bulk waste',
    district: 'Parkside District',
    status: 'Received',
    description:
      'Three bags of construction debris and a broken chair dumped along the fence line by the public lot.',
    address: 'Parkside Lot, 1180 Park Ave, San Jose, CA 95126',
    assignedTo: 'Environmental Services',
    estimatedResolution: 'Estimated 3-5 days based on sanitation pickup history',
    reportCount: 7,
    isFollowing: false,
    isUserOwned: false,
    photoCount: 1,
    pin: { top: 68, left: 246, color: '#28A745' },
    timeline: [
      { label: 'Submitted', dateText: 'Apr 25, 2026 at 7:14 AM', reached: true },
      { label: 'Received', dateText: 'Apr 25, 2026 at 8:02 AM', reached: true },
      { label: 'In Progress', dateText: 'Pending route confirmation', reached: false },
      { label: 'Resolved', dateText: 'Pending', reached: false },
    ],
  },
  {
    id: 'GC-2026-04564',
    title: 'Graffiti on library mural wall',
    category: 'Graffiti',
    tag: 'Public art damage',
    district: 'Market South District',
    status: 'Resolved',
    description:
      'Fresh graffiti covers the lower section of the community mural facing the bus plaza.',
    address: 'Main Library Plaza, Market St, San Jose, CA 95113',
    assignedTo: 'Parks & Recreation Dept.',
    estimatedResolution: 'Resolved in 2 days, faster than the 4-day district average',
    reportCount: 5,
    isFollowing: true,
    isUserOwned: false,
    photoCount: 3,
    pin: { top: 154, left: 216, color: '#A35DFF' },
    timeline: [
      { label: 'Submitted', dateText: 'Apr 18, 2026 at 10:09 AM', reached: true },
      { label: 'Received', dateText: 'Apr 18, 2026 at 10:27 AM', reached: true },
      { label: 'In Progress', dateText: 'Apr 19, 2026 at 8:10 AM', reached: true },
      { label: 'Resolved', dateText: 'Apr 20, 2026 at 4:42 PM', reached: true },
    ],
  },
]

export const demoReport = dashboardIssues[0]
