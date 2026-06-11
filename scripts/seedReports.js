#!/usr/bin/env node
/**
 * Seeds 15 sample reports into Supabase.
 *
 * Prerequisites:
 *   1. Create scripts/.env with:
 *        SUPABASE_URL=https://<project>.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
 *      (URL can also be read from mobile/.env as EXPO_PUBLIC_SUPABASE_URL)
 *
 * Run: node scripts/seedReports.js
 */

const fs   = require('fs')
const path = require('path')
const https = require('https')
const http  = require('http')

// ── Minimal .env loader (no dotenv dependency) ────────────────────────────────
function loadEnvFile(filepath) {
  try {
    fs.readFileSync(filepath, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/)
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
      }
    })
  } catch {}
}

loadEnvFile(path.join(__dirname, '.env'))
loadEnvFile(path.join(__dirname, '../mobile/.env'))

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in scripts/.env')
  process.exit(1)
}

// ── Supabase REST helper (no npm packages) ────────────────────────────────────
function supabaseRequest(method, table, body, params) {
  return new Promise((resolve, reject) => {
    const baseUrl = SUPABASE_URL.replace(/\/$/, '')
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    const url = new URL(`${baseUrl}/rest/v1/${table}${qs}`)
    const payload = body ? JSON.stringify(body) : null
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates,return=representation',
      },
    }
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload)

    const lib = url.protocol === 'https:' ? https : http
    const req = lib.request(options, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null })
        } catch {
          resolve({ status: res.statusCode, data })
        }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

// ── Seed report definitions ───────────────────────────────────────────────────
const now = Date.now()
const mins = (m) => m * 60_000

function ts(minutesAgo) {
  return new Date(now - minutesAgo).toISOString()
}

const SEED_REPORTS = [
  // ── 3 days ago — 4 reports ──────────────────────────────────────────────────
  {
    user_id:             null,
    external_id:         'GC-2026-05421',
    title:               'Illegal Dumping at 4th & Santa Clara',
    category:            'Illegal Dumping',
    tag:                 'Illegal Dumping',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Multiple garbage bags and construction debris dumped at the northeast corner. Blocking partial sidewalk access.',
    address:             '4th St & Santa Clara St, San Jose, CA 95112',
    assigned_to:         'Environmental Services',
    estimated_resolution: 'Est. 1–2 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       '4th St & Santa Clara St',
    location_sub:        'San Jose, CA 95112',
    merged:              false,
    pin:                 { lat: 37.3384, lon: -121.8866 },
    timeline: [
      { label: 'Submitted', dateText: 'May 10, 2026 at 8:14 AM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
    created_at: ts(mins(3 * 24 * 60 + 22 * 60 + 46)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05422',
    title:               'Graffiti on Market & Post',
    category:            'Graffiti',
    tag:                 'Graffiti',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Large spray-paint tagging on a concrete retaining wall, approximately 15 feet wide. Contains offensive language.',
    address:             'Market St & Post St, San Jose, CA 95113',
    assigned_to:         'Parks & Recreation Dept.',
    estimated_resolution: 'Est. 2–4 hours',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'Market St & Post St',
    location_sub:        'San Jose, CA 95113',
    merged:              false,
    pin:                 { lat: 37.3366, lon: -121.8912 },
    timeline: [
      { label: 'Submitted', dateText: 'May 10, 2026 at 10:47 AM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 2–4 hours' },
    ],
    created_at: ts(mins(3 * 24 * 60 + 20 * 60 + 13)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05423',
    title:               'Pothole at 7th & Empire',
    category:            'Pothole',
    tag:                 'Pothole',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Deep pothole in the right travel lane, approximately 18 inches wide. Sharp edge is causing vehicle damage risk.',
    address:             'N 7th St & Empire St, San Jose, CA 95112',
    assigned_to:         'Dept. of Transportation',
    estimated_resolution: 'Est. 1–2 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'N 7th St & Empire St',
    location_sub:        'San Jose, CA 95112',
    merged:              false,
    pin:                 { lat: 37.3368, lon: -121.8805 },
    timeline: [
      { label: 'Submitted', dateText: 'May 10, 2026 at 2:33 PM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
    created_at: ts(mins(3 * 24 * 60 + 16 * 60 + 27)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05424',
    title:               'Illegal Dumping at S 1st & Reed',
    category:            'Illegal Dumping',
    tag:                 'Illegal Dumping',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Old furniture — a couch and two mattresses — left at the curb outside the designated bulky pickup schedule.',
    address:             'S 1st St & Reed St, San Jose, CA 95112',
    assigned_to:         'Environmental Services',
    estimated_resolution: 'Est. 1–2 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'S 1st St & Reed St',
    location_sub:        'San Jose, CA 95112',
    merged:              false,
    pin:                 { lat: 37.3286, lon: -121.8858 },
    timeline: [
      { label: 'Submitted', dateText: 'May 10, 2026 at 4:51 PM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
    created_at: ts(mins(3 * 24 * 60 + 14 * 60 + 9)),
  },

  // ── Yesterday — 5 reports ───────────────────────────────────────────────────
  {
    user_id:             null,
    external_id:         'GC-2026-05425',
    title:               'Pothole at Santa Clara & 10th',
    category:            'Pothole',
    tag:                 'Pothole',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Series of three connected potholes spanning the bike lane and right travel lane. Cyclists are swerving into traffic.',
    address:             'E Santa Clara St & S 10th St, San Jose, CA 95112',
    assigned_to:         'Dept. of Transportation',
    estimated_resolution: 'Est. 1–2 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'E Santa Clara St & S 10th St',
    location_sub:        'San Jose, CA 95112',
    merged:              false,
    pin:                 { lat: 37.3381, lon: -121.8760 },
    timeline: [
      { label: 'Submitted', dateText: 'May 12, 2026 at 7:22 AM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
    created_at: ts(mins(1 * 24 * 60 + 23 * 60 + 38)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05426',
    title:               'Streetlight Out at N 1st & Saint James',
    category:            'Streetlight Outage',
    tag:                 'Streetlight Outage',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Streetlight has been completely dark for at least 3 nights. Intersection is near a park and poorly lit after sunset.',
    address:             'N 1st St & Saint James St, San Jose, CA 95112',
    assigned_to:         'Dept. of Public Works',
    estimated_resolution: 'Est. 10–14 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'N 1st St & Saint James St',
    location_sub:        'San Jose, CA 95112',
    merged:              false,
    pin:                 { lat: 37.3408, lon: -121.8881 },
    timeline: [
      { label: 'Submitted', dateText: 'May 12, 2026 at 9:05 AM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 10–14 days' },
    ],
    created_at: ts(mins(1 * 24 * 60 + 21 * 60 + 55)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05427',
    title:               'Graffiti on 3rd & Saint James',
    category:            'Graffiti',
    tag:                 'Graffiti',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Tag marks on the side of a city utility box and the adjacent brick wall. Multiple colors, relatively fresh.',
    address:             'N 3rd St & Saint James St, San Jose, CA 95112',
    assigned_to:         'Parks & Recreation Dept.',
    estimated_resolution: 'Est. 2–4 hours',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'N 3rd St & Saint James St',
    location_sub:        'San Jose, CA 95112',
    merged:              false,
    pin:                 { lat: 37.3406, lon: -121.8873 },
    timeline: [
      { label: 'Submitted', dateText: 'May 12, 2026 at 11:30 AM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 2–4 hours' },
    ],
    created_at: ts(mins(1 * 24 * 60 + 19 * 60 + 30)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05428',
    title:               'Illegal Dumping near San Pedro & Julian',
    category:            'Illegal Dumping',
    tag:                 'Illegal Dumping',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Abandoned household appliances — a washing machine and dryer — left on the sidewalk, partially blocking the curb-cut ramp.',
    address:             'San Pedro St & Julian St, San Jose, CA 95112',
    assigned_to:         'Environmental Services',
    estimated_resolution: 'Est. 1–2 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'San Pedro St & Julian St',
    location_sub:        'San Jose, CA 95112',
    merged:              false,
    pin:                 { lat: 37.3432, lon: -121.8945 },
    timeline: [
      { label: 'Submitted', dateText: 'May 12, 2026 at 3:18 PM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
    created_at: ts(mins(1 * 24 * 60 + 15 * 60 + 42)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05429',
    title:               'Abandoned Vehicle at Almaden & Park',
    category:            'Vehicle Concerns',
    tag:                 'Vehicle Concerns',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Vehicle with no plates parked for over 72 hours. No registration tag visible on windshield. Possible stolen vehicle.',
    address:             'Almaden Blvd & Park Ave, San Jose, CA 95110',
    assigned_to:         'San Jose Police Dept.',
    estimated_resolution: 'Est. 1–2 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'Almaden Blvd & Park Ave',
    location_sub:        'San Jose, CA 95110',
    merged:              false,
    pin:                 { lat: 37.3280, lon: -121.8890 },
    timeline: [
      { label: 'Submitted', dateText: 'May 12, 2026 at 6:44 PM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
    created_at: ts(mins(1 * 24 * 60 + 12 * 60 + 16)),
  },

  // ── Today (within last 24h) — 6 reports ─────────────────────────────────────
  {
    user_id:             null,
    external_id:         'GC-2026-05430',
    title:               'Pothole at 1st & San Fernando',
    category:            'Pothole',
    tag:                 'Pothole',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Pothole near the crosswalk, approximately 12 inches in diameter and 3 inches deep. Creates a tripping hazard for pedestrians.',
    address:             'S 1st St & San Fernando St, San Jose, CA 95113',
    assigned_to:         'Dept. of Transportation',
    estimated_resolution: 'Est. 1–2 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'S 1st St & San Fernando St',
    location_sub:        'San Jose, CA 95113',
    merged:              false,
    pin:                 { lat: 37.3357, lon: -121.8885 },
    timeline: [
      { label: 'Submitted', dateText: 'May 13, 2026 at 7:09 AM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
    created_at: ts(mins(7 * 60)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05431',
    title:               'Streetlight Out at N Market & Hedding',
    category:            'Streetlight Outage',
    tag:                 'Streetlight Outage',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Streetlight pole appears damaged at the base and the light is not functioning. Hazard to nighttime pedestrians and drivers.',
    address:             'N Market St & E Hedding St, San Jose, CA 95112',
    assigned_to:         'Dept. of Public Works',
    estimated_resolution: 'Est. 10–14 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'N Market St & E Hedding St',
    location_sub:        'San Jose, CA 95112',
    merged:              false,
    pin:                 { lat: 37.3503, lon: -121.8893 },
    timeline: [
      { label: 'Submitted', dateText: 'May 13, 2026 at 8:25 AM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 10–14 days' },
    ],
    created_at: ts(mins(6 * 60)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05432',
    title:               'Graffiti at W Santa Clara & Delmas',
    category:            'Graffiti',
    tag:                 'Graffiti',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         "Graffiti on a storefront's roll-up gate and adjacent wall. Business owner reports it appeared overnight.",
    address:             'W Santa Clara St & Delmas Ave, San Jose, CA 95126',
    assigned_to:         'Parks & Recreation Dept.',
    estimated_resolution: 'Est. 2–4 hours',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'W Santa Clara St & Delmas Ave',
    location_sub:        'San Jose, CA 95126',
    merged:              false,
    pin:                 { lat: 37.3370, lon: -121.9005 },
    timeline: [
      { label: 'Submitted', dateText: 'May 13, 2026 at 9:42 AM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 2–4 hours' },
    ],
    created_at: ts(mins(5 * 60)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05433',
    title:               'Illegal Dumping at Race & Julian',
    category:            'Illegal Dumping',
    tag:                 'Illegal Dumping',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Cardboard boxes and bags of household waste dumped on the sidewalk next to a vacant lot. Potential pest attraction.',
    address:             'Race St & W Julian St, San Jose, CA 95126',
    assigned_to:         'Environmental Services',
    estimated_resolution: 'Est. 1–2 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'Race St & W Julian St',
    location_sub:        'San Jose, CA 95126',
    merged:              false,
    pin:                 { lat: 37.3445, lon: -121.9008 },
    timeline: [
      { label: 'Submitted', dateText: 'May 13, 2026 at 10:55 AM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 1–2 days' },
    ],
    created_at: ts(mins(4 * 60)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05434',
    title:               'Encampment at N 4th & William',
    category:            'Encampment Concerns',
    tag:                 'Encampment Concerns',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Encampment of approximately 4–5 tents under the freeway overpass. Visible debris and waste around the perimeter of the site.',
    address:             'N 4th St & William St, San Jose, CA 95112',
    assigned_to:         'Dept. of Housing',
    estimated_resolution: 'Est. 3–5 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'N 4th St & William St',
    location_sub:        'San Jose, CA 95112',
    merged:              false,
    pin:                 { lat: 37.3328, lon: -121.8847 },
    timeline: [
      { label: 'Submitted', dateText: 'May 13, 2026 at 11:38 AM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 3–5 days' },
    ],
    created_at: ts(mins(3 * 60)),
  },
  {
    user_id:             null,
    external_id:         'GC-2026-05435',
    title:               'Junk Pickup at Almaden & San Carlos',
    category:            'Illegal Dumping',
    tag:                 'Junk Pickup',
    district:            'San Jose District 3',
    status:              'Submitted',
    description:         'Pile of old electronics, a broken chair, and miscellaneous junk left at the curb outside of regular scheduled pickup days.',
    address:             'Almaden Ave & W San Carlos St, San Jose, CA 95128',
    assigned_to:         'Environmental Services',
    estimated_resolution: 'Est. 10–15 days',
    report_count:        1,
    photo_count:         0,
    photo_url:           null,
    location_main:       'Almaden Ave & W San Carlos St',
    location_sub:        'San Jose, CA 95128',
    merged:              false,
    pin:                 { lat: 37.3274, lon: -121.8925 },
    timeline: [
      { label: 'Submitted', dateText: 'May 13, 2026 at 2:14 PM', reached: true },
      { label: 'In Review',   dateText: 'Pending' },
      { label: 'In Progress', dateText: 'Pending' },
      { label: 'Resolved',    dateText: 'Est. 10–15 days' },
    ],
    created_at: ts(mins(60)),
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Seeding ${SEED_REPORTS.length} reports into Supabase...`)

  // Check which external_ids already exist
  const ids = SEED_REPORTS.map(r => r.external_id)
  const checkResult = await supabaseRequest('GET', 'reports', null, {
    select: 'external_id',
    external_id: `in.(${ids.join(',')})`,
  })

  const existing = new Set(
    (Array.isArray(checkResult.data) ? checkResult.data : []).map(r => r.external_id)
  )

  const toInsert = SEED_REPORTS.filter(r => !existing.has(r.external_id))

  if (toInsert.length === 0) {
    console.log('All seed reports already exist — nothing to insert.')
    return
  }

  console.log(`Inserting ${toInsert.length} reports (${existing.size} already exist)...`)

  const result = await supabaseRequest('POST', 'reports', toInsert, null)

  if (result.status >= 200 && result.status < 300) {
    const inserted = Array.isArray(result.data) ? result.data.length : toInsert.length
    console.log(`Done. Inserted ${inserted} seed reports.`)
  } else {
    console.error(`Insert failed (HTTP ${result.status}):`, result.data)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Seed error:', err)
  process.exit(1)
})
