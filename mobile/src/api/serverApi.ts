export const API_BASE = (
  (process.env.EXPO_PUBLIC_REPORT_API_URL ?? 'http://127.0.0.1:3001')
).replace(/\/$/, '')

const TIMEOUT_MS = 8_000

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function fetchDashboardV1(): Promise<unknown> {
  return getJson('/api/dashboard/v1')
}

export async function fetchDashboardV2(): Promise<unknown> {
  return getJson('/api/dashboard/v2')
}

export async function fetchDashboardMeta(): Promise<{
  lastRefreshed: string | null
  currentMonth: string | null
} | null> {
  return getJson('/api/dashboard/meta')
}

export type SubmissionPayload = {
  id: string
  lat: number | null
  lon: number | null
  category: string
  submittedAt: string
}

export type SubmissionStatus = {
  ok: boolean
  id: string
  status: string
  matched311Id: string | null
  submittedAt: string
  lastStatusUpdate: string
}

export async function postSubmission(payload: SubmissionPayload): Promise<{ id: string } | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${API_BASE}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    return { id: data.submission?.id ?? payload.id }
  } catch {
    return null
  }
}

export async function fetchSubmissionStatus(id: string): Promise<SubmissionStatus | null> {
  return getJson(`/api/submissions/${encodeURIComponent(id)}/status`)
}

export type Sj311PrepareBody = {
  classification: {
    category: string
    tag: string
    desc: string
    locationMain: string
    locationSub: string
    latitude?: number
    longitude?: number
  }
  reporter?: {
    email?: string | null
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
  }
}

export type Sj311PrepareResponse = {
  ok: boolean
  mode: 'webview_autofill' | 'log'
  portalUrl: string
  payload: Record<string, unknown>
  autofillScript: string
  instructions: string[]
}

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function prepareSj311Submission(
  body: Sj311PrepareBody,
): Promise<Sj311PrepareResponse | null> {
  return postJson<Sj311PrepareResponse>('/api/sj311/prepare', body)
}

export async function submitSj311Report(
  body: Sj311PrepareBody,
): Promise<Record<string, unknown> | null> {
  return postJson<Record<string, unknown>>('/api/sj311/submit', body)
}
