export type AppTab = 'dashboard' | 'report' | 'profile'

export type ReportStatus = 'Submitted' | 'In Review' | 'In Progress' | 'Resolved'

export type IssueCategory =
  | 'Pothole'
  | 'Streetlight Outage'
  | 'Graffiti'
  | 'Illegal Dumping'
  | 'Transit Signage'
  | 'Vehicle Concerns'
  | 'Encampment'
  | 'Junk Pickup'

export type TimelineEntry = {
  label: ReportStatus
  dateText: string
}

export type ReportDraft = {
  photoCount: number
  category: IssueCategory
  description: string
  notes: string
  address: string
  neighborhood: string
  duplicateNearby: boolean
}

export type ReportRecord = {
  id: string
  category: IssueCategory
  status: ReportStatus
  description: string
  address: string
  assignedTo: string
  timeline: TimelineEntry[]
}
