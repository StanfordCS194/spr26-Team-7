import { IssueCategory, ReportDraft, ReportRecord } from '../types'

export const issueCategories: IssueCategory[] = [
  'Pothole',
  'Streetlight Outage',
  'Graffiti',
  'Illegal Dumping',
  'Transit Signage',
]

export const initialDraft: ReportDraft = {
  photoCount: 1,
  category: 'Pothole',
  description: 'A medium-sized pothole approximately 8 inches in diameter located in the right lane of the street.',
  notes: '',
  address: '123 Main St, City, ST 12345',
  neighborhood: 'Downtown',
  duplicateNearby: true,
}

export const demoReport: ReportRecord = {
  id: 'GC-2026-04821',
  category: 'Pothole',
  status: 'In Review',
  description: 'A medium-sized pothole approximately 8 inches in diameter located in the right lane of the street.',
  address: '123 Main St, City, ST 12345',
  assignedTo: 'Department of Public Works',
  timeline: [
    { label: 'Submitted', dateText: 'Apr 19, 2026 at 2:30 PM' },
    { label: 'In Review', dateText: 'Apr 19, 2026 at 3:15 PM' },
    { label: 'In Progress', dateText: 'Pending assignment' },
    { label: 'Resolved', dateText: 'Estimated 4-7 days' },
  ],
}

export const topIssues = [
  '14 reports: pothole on 4th and Santa Clara',
  '9 reports: broken streetlight on Elm and 2nd',
  '7 reports: illegal dumping near Parkside Lot',
]
