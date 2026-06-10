import { MapReport } from '../data/mockMapReports'
import { ReportRow, reportRowToMapReport } from './reports'
import { supabase } from './supabase'

export const fetchAllMapReports = async (): Promise<MapReport[]> => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => reportRowToMapReport(row as ReportRow))
}
