import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type ProfileRow = {
  id: string
  full_name: string | null
  zip_code: string | null
  created_at: string
}

export type ProfileSummary = {
  fullName: string | null
  zipCode: string | null
  email: string | null
  totalSubmitted: number
  resolvedCount: number
  memberSince: string | null
  reports: Array<{
    id: string
    title: string
    status: string
    createdAt: string
  }>
}

export const ensureProfile = async (user: User) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    full_name:
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : null,
    zip_code:
      typeof user.user_metadata?.zip_code === 'string'
        ? user.user_metadata.zip_code
        : null,
  })

  if (insertError) {
    throw insertError
  }
}

export const fetchProfileSummary = async (user: User): Promise<ProfileSummary> => {
  await ensureProfile(user)

  const [{ data: profile, error: profileError }, { data: reports, error: reportsError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, zip_code, created_at')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('reports')
        .select('external_id, title, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

  if (profileError) {
    throw profileError
  }

  if (reportsError) {
    throw reportsError
  }

  const ownedReports = reports ?? []
  const resolvedCount = ownedReports.filter((report) => report.status === 'Resolved').length

  return {
    fullName:
      profile?.full_name ??
      (typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : null),
    zipCode:
      profile?.zip_code ??
      (typeof user.user_metadata?.zip_code === 'string'
        ? user.user_metadata.zip_code
        : null),
    email: user.email ?? null,
    totalSubmitted: ownedReports.length,
    resolvedCount,
    memberSince: profile?.created_at ?? user.created_at ?? null,
    reports: ownedReports.map((report) => ({
      id: report.external_id,
      title: report.title,
      status: report.status,
      createdAt: report.created_at,
    })),
  }
}
