import { ImageSourcePropType } from 'react-native'

export type AppTab = 'dashboard' | 'report' | 'profile'

export type ReportStatus =
  | 'Submitted'
  | 'Received'
  | 'In Progress'
  | 'Resolved'
  | 'Ready to submit'
  | 'Draft report'

export type IssueCategory =
  | 'Pothole'
  | 'Streetlight Outage'
  | 'Graffiti'
  | 'Illegal Dumping'
  | 'Vehicle Concerns'
  | 'Encampment Concerns'

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

export type SampleIssueImage =
  | {
      kind: 'asset'
      source: ImageSourcePropType
      alt: string
    }
  | {
      kind: 'placeholder'
      label: string
      icon: string
      accent: string
      backgroundColor: string
    }

export type SampleIssueRecord = {
  id: string
  type: string
  title: string
  image: SampleIssueImage
  locationName: string
  address: string
  latitude: number
  longitude: number
  description: string
  status: ReportStatus
  category: IssueCategory
  tag: string
  district: string
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
  integration: {
    source: 'demo-library'
    mapFeatureType: 'point'
    markerColor: string
  }
}
