export type AppTab = 'dashboard' | 'report' | 'profile'

export type ReportStatus = 'Submitted' | 'Received' | 'In Progress' | 'Resolved'

export type IssueCategory =
  | 'Pothole'
  | 'Streetlight Outage'
  | 'Graffiti'
  | 'Illegal Dumping'
  | 'Transit Signage'

export type TimelineEntry = {
  label: ReportStatus
  dateText: string
  reached: boolean
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
  title: string
  category: IssueCategory
  tag: string
  district: string
  status: ReportStatus
  description: string
  address: string
  assignedTo: string
  estimatedResolution: string
  reportCount: number
  isFollowing: boolean
  isUserOwned: boolean
  photoCount: number
  pin: {
    top: number
    left: number
    color: string
  }
  timeline: TimelineEntry[]
}
