import { Classification } from '../screens/ClassificationScreen'
import { SampleIssueRecord } from '../types'
import {
  DISTRICT_CENTERS,
  MapReport,
  MapReportCategoryId,
  MapReportStatus,
} from '../data/mockMapReports'
import { supabase } from './supabase'

const CATEGORY_TO_ID: Record<string, MapReportCategoryId> = {
  Pothole: 'pothole',
  'Streetlight Outage': 'streetlight',
  Graffiti: 'graffiti',
  'Illegal Dumping': 'dumping',
  'Vehicle Concerns': 'vehicle',
  'Encampment Concerns': 'encampment',
}

type StoredPin = {
  lat?: number
  lon?: number
  sampleIssueId?: string | null
}

type TimelineJsonEntry = {
  label?: string
  dateText?: string
  reached?: boolean
}

export type ReportRow = {
  id: string
  user_id: string | null
  external_id: string
  title: string
  category: string
  tag: string
  district: string
  status: MapReportStatus
  description: string
  address: string
  assigned_to: string
  estimated_resolution: string
  report_count: number
  photo_count: number
  location_main: string | null
  location_sub: string | null
  merged: boolean
  pin: StoredPin | null
  timeline: TimelineJsonEntry[]
  created_at: string
  updated_at: string
}

const formatSubmittedDate = (createdAt: string) =>
  new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

const parseDistrictNumber = (district: string) => {
  const match = district.match(/\d+/)
  return match ? parseInt(match[0], 10) : 3
}

const resolveCoordinates = (row: ReportRow) => {
  const district = parseDistrictNumber(row.district)
  const center = DISTRICT_CENTERS[district] ?? DISTRICT_CENTERS[3]

  return {
    district,
    lat: row.pin?.lat ?? center.latitude,
    lon: row.pin?.lon ?? center.longitude,
  }
}

const parseTimeline = (row: ReportRow) => {
  if (Array.isArray(row.timeline) && row.timeline.length > 0) {
    return row.timeline.map((entry) => ({
      label: String(entry.label ?? row.status),
      dateText: String(entry.dateText ?? formatSubmittedDate(row.created_at)),
    }))
  }

  return [{ label: row.status, dateText: formatSubmittedDate(row.created_at) }]
}

const createExternalId = () =>
  `cityfix-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

export const reportRowToMapReport = (row: ReportRow): MapReport => {
  const { district, lat, lon } = resolveCoordinates(row)

  return {
    id: row.id,
    categoryId: CATEGORY_TO_ID[row.category] ?? 'pothole',
    title: row.title,
    address: row.address,
    district,
    lat,
    lon,
    status: row.status,
    createdAt: new Date(row.created_at),
    description: row.description,
    assignedTo: row.assigned_to,
    timeline: parseTimeline(row),
  }
}

export const getSampleIssueIdFromRow = (row: ReportRow) => row.pin?.sampleIssueId ?? null

export const fetchUserReports = async (userId: string): Promise<ReportRow[]> => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as ReportRow[]
}

export const fetchReportsByIds = async (reportIds: string[]): Promise<ReportRow[]> => {
  if (reportIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .in('id', reportIds)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as ReportRow[]
}

export const createReport = async (
  userId: string,
  classification: Classification,
  sampleIssue: SampleIssueRecord | null,
): Promise<ReportRow> => {
  const district = sampleIssue?.district ?? 'San Jose District 3'
  const districtNumber = parseDistrictNumber(district)
  const center = DISTRICT_CENTERS[districtNumber] ?? DISTRICT_CENTERS[3]
  const lat = classification.latitude ?? sampleIssue?.latitude ?? center.latitude
  const lon = classification.longitude ?? sampleIssue?.longitude ?? center.longitude

  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      external_id: createExternalId(),
      title: classification.tag,
      category: classification.category,
      tag: classification.tag,
      district,
      status: 'Submitted',
      description: classification.desc,
      address: `${classification.locationMain}, ${classification.locationSub}`,
      assigned_to: sampleIssue?.assignedTo ?? 'Dept. of Public Works',
      estimated_resolution: sampleIssue?.estimatedResolution ?? 'Pending review',
      report_count: 1,
      photo_count: 1,
      location_main: classification.locationMain,
      location_sub: classification.locationSub,
      merged: false,
      pin: {
        lat,
        lon,
        sampleIssueId: sampleIssue?.id ?? null,
      },
      timeline: [{ label: 'Submitted', dateText: 'Just now', reached: true }],
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as ReportRow
}
