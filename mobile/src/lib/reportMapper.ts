import { issueCategories } from '../data/mockData'
import { IssueCategory, ReportRecord, ReportStatus, TimelineEntry } from '../types'

export type ReportRow = {
  id: string
  user_id: string | null
  external_id: string
  title: string
  category: string
  tag: string
  district: string
  status: string
  description: string
  address: string
  assigned_to: string
  estimated_resolution: string
  report_count: number
  photo_count: number
  location_main: string | null
  location_sub: string | null
  merged: boolean
  pin: { top: number; left: number; color: string } | null
  timeline: TimelineEntry[] | null
  created_at: string
}

const reportStatuses: ReportStatus[] = [
  'Submitted',
  'Received',
  'In Progress',
  'Resolved',
]

const normalizeStatus = (status: string): ReportStatus =>
  reportStatuses.includes(status as ReportStatus) ? (status as ReportStatus) : 'Submitted'

const normalizeCategory = (value: string): IssueCategory =>
  issueCategories.includes(value as IssueCategory) ? (value as IssueCategory) : 'Pothole'

const formatTimelineDate = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

export const buildSubmittedTimeline = (submittedAt = new Date()): TimelineEntry[] => [
  {
    label: 'Submitted',
    dateText: formatTimelineDate(submittedAt.toISOString()),
    reached: true,
  },
  { label: 'Received', dateText: 'Pending', reached: false },
  { label: 'In Progress', dateText: 'Pending', reached: false },
  { label: 'Resolved', dateText: 'Pending', reached: false },
]

export const mapReportRowToRecord = (
  row: ReportRow,
  userId: string | null,
  followingIds: Set<string>
): ReportRecord => ({
  id: row.external_id,
  title: row.title,
  category: normalizeCategory(row.category),
  tag: row.tag,
  district: row.district,
  status: normalizeStatus(row.status),
  description: row.description,
  address: row.address,
  assignedTo: row.assigned_to,
  estimatedResolution: row.estimated_resolution,
  reportCount: row.report_count,
  isFollowing: followingIds.has(row.id),
  isUserOwned: Boolean(userId && row.user_id === userId),
  photoCount: row.photo_count,
  pin: row.pin ?? { top: 40, left: 80, color: '#2563eb' },
  timeline: row.timeline ?? buildSubmittedTimeline(new Date(row.created_at)),
})

export const formatReportDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

export const formatMemberSince = (value: string) => {
  const createdAt = new Date(value)
  const now = new Date()
  const months =
    (now.getFullYear() - createdAt.getFullYear()) * 12 +
    (now.getMonth() - createdAt.getMonth())

  if (months <= 0) {
    return 'Less than 1 month'
  }

  if (months === 1) {
    return '1 month'
  }

  return `${months} months`
}
