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
  'Vehicle Concerns': 'Public Safety',
  'Encampment': 'Housing & Homelessness',
  'Junk Pickup': 'Environmental Services',
}

export const getCategoryGroup = (category: IssueCategory): string =>
  categoryGroupMap[category] ?? 'Roads & Infrastructure'

const departmentMap: Record<IssueCategory, { name: string; division: string }> = {
  'Pothole': { name: 'Dept. of Transportation', division: 'Street Maintenance · 311' },
  'Streetlight Outage': { name: 'Dept. of Public Works', division: 'Electrical Services · 311' },
  'Graffiti': { name: 'Parks & Recreation Dept.', division: 'Beautification Division · 311' },
  'Illegal Dumping': { name: 'Environmental Services', division: 'Code Enforcement · 311' },
  'Transit Signage': { name: 'Transportation Authority', division: 'Transit Operations · 311' },
  'Vehicle Concerns': { name: 'San Jose Police Dept.', division: 'Traffic Operations · 311' },
  'Encampment': { name: 'Dept. of Housing', division: 'Encampment Management · 311' },
  'Junk Pickup': { name: 'Environmental Services', division: 'Bulky Item Pickup · 311' },
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

export const demoReport: ReportRecord = {
  id: 'GC-2026-04821',
  category: 'Pothole',
  status: 'In Review',
  description:
    'Significant pothole on Willow St near Lincoln Ave causing road hazard. Approximately 2ft wide with visible asphalt damage.',
  address: 'Willow St & Lincoln Ave, San Jose, CA 95125',
  assignedTo: 'Dept. of Transportation',
  timeline: [
    { label: 'Submitted', dateText: 'Apr 26, 2026 at 2:30 PM' },
    { label: 'In Review', dateText: 'Apr 26, 2026 at 3:15 PM' },
    { label: 'In Progress', dateText: 'Pending assignment' },
    { label: 'Resolved', dateText: 'Estimated 4–7 days' },
  ],
}

export const topIssues = [
  '14 reports: pothole on 4th and Santa Clara',
  '9 reports: broken streetlight on Elm and 2nd',
  '7 reports: illegal dumping near Parkside Lot',
]
