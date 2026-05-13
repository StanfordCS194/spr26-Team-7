import { Classification } from '../screens/ClassificationScreen'
import { ReportRecord } from '../types'
import {
  buildSubmittedTimeline,
  mapReportRowToRecord,
  ReportRow,
} from './reportMapper'
import { supabase } from './supabase'

const generateExternalId = () => {
  const year = new Date().getFullYear()
  const suffix = Math.floor(10000 + Math.random() * 90000)
  return `GC-${year}-${suffix}`
}

const getAssignedTo = (category: string) => {
  if (category.toLowerCase().includes('transit')) {
    return 'Transportation Authority'
  }

  if (category.toLowerCase().includes('utility')) {
    return 'Dept. of Public Works'
  }

  if (category.toLowerCase().includes('park')) {
    return 'Parks & Recreation Dept.'
  }

  return 'Dept. of Transportation'
}

export const fetchDashboardReports = async (userId: string): Promise<ReportRecord[]> => {
  const [{ data: reports, error: reportsError }, { data: follows, error: followsError }] =
    await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('report_follows').select('report_id').eq('user_id', userId),
    ])

  if (reportsError) {
    throw reportsError
  }

  if (followsError) {
    throw followsError
  }

  const followingIds = new Set((follows ?? []).map((follow) => follow.report_id))

  return (reports ?? []).map((report) =>
    mapReportRowToRecord(report as ReportRow, userId, followingIds)
  )
}

export const createReportFromClassification = async (
  userId: string,
  classification: Classification,
  options: { merged: boolean; photoCount?: number }
) => {
  const externalId = generateExternalId()
  const address = `${classification.locationMain}, ${classification.locationSub}`
  const title = `${classification.tag} at ${classification.locationMain}`
  const timeline = buildSubmittedTimeline()
  const pin = {
    top: 24 + Math.floor(Math.random() * 120),
    left: 24 + Math.floor(Math.random() * 220),
    color: options.merged ? '#2563eb' : '#16a34a',
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      external_id: externalId,
      title,
      category: classification.tag,
      tag: classification.tag,
      district: classification.locationSub || 'San Jose',
      status: 'Submitted',
      description: classification.desc,
      address,
      assigned_to: getAssignedTo(classification.category),
      estimated_resolution: options.merged
        ? 'Merged with nearby reports for faster routing'
        : 'Pending review',
      report_count: options.merged ? 2 : 1,
      photo_count: options.photoCount ?? 1,
      location_main: classification.locationMain,
      location_sub: classification.locationSub,
      merged: options.merged,
      pin,
      timeline,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapReportRowToRecord(data as ReportRow, userId, new Set())
}

export const setReportFollow = async (
  userId: string,
  reportId: string,
  follow: boolean
) => {
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id')
    .eq('external_id', reportId)
    .maybeSingle()

  if (reportError) {
    throw reportError
  }

  if (!report) {
    throw new Error('Report not found.')
  }

  if (follow) {
    const { error } = await supabase.from('report_follows').insert({
      user_id: userId,
      report_id: report.id,
    })

    if (error && error.code !== '23505') {
      throw error
    }

    return
  }

  const { error } = await supabase
    .from('report_follows')
    .delete()
    .eq('user_id', userId)
    .eq('report_id', report.id)

  if (error) {
    throw error
  }
}

export const incrementReportPhotoCount = async (reportId: string) => {
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id, photo_count')
    .eq('external_id', reportId)
    .maybeSingle()

  if (reportError) {
    throw reportError
  }

  if (!report) {
    throw new Error('Report not found.')
  }

  const { error } = await supabase
    .from('reports')
    .update({ photo_count: report.photo_count + 1 })
    .eq('id', report.id)

  if (error) {
    throw error
  }
}
