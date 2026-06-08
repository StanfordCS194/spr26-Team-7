import { supabase } from './supabase'

export const fetchFollowedReportIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('report_follows')
    .select('report_id')
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => row.report_id as string)
}

export const followReport = async (userId: string, reportId: string) => {
  const { error } = await supabase.from('report_follows').insert({
    user_id: userId,
    report_id: reportId,
  })

  if (error) {
    throw error
  }
}

export const unfollowReport = async (userId: string, reportId: string) => {
  const { error } = await supabase
    .from('report_follows')
    .delete()
    .eq('user_id', userId)
    .eq('report_id', reportId)

  if (error) {
    throw error
  }
}
