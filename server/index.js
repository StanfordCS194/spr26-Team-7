const express      = require('express')
const cors         = require('cors')
const nodemailer   = require('nodemailer')
const cron         = require('node-cron')
const fs           = require('fs')
const path         = require('path')
const https        = require('https')
const { execFile } = require('child_process')
const readline     = require('readline')
const crypto       = require('crypto')

// ── Paths ─────────────────────────────────────────────────────────────────────
const ROOT_DIR         = path.join(__dirname, '..')
const DATA_DIR         = path.join(__dirname, 'data')
const CSV_2026         = path.join(ROOT_DIR, 'mobile/src/data/SJ311_2017to20260512/311-service-requests-2026.csv')
const CSV_DOWNLOAD_URL = 'https://data.sanjoseca.gov/dataset/5bd6605f-43fc-4ccc-b80b-3c15b5a02319/resource/d886727c-60f1-4be7-9a30-f6806375b1a3/download/311-service-requests-2026.csv'
const SCRIPT_V1        = path.join(ROOT_DIR, 'scripts/buildDashboard311.js')
const SCRIPT_V2        = path.join(ROOT_DIR, 'scripts/buildDashboard311v2.js')
const DASHBOARD_V1     = path.join(ROOT_DIR, 'mobile/src/data/dashboard311.json')
const DASHBOARD_V2     = path.join(ROOT_DIR, 'mobile/src/data/dashboard311v2.json')
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json')
const META_FILE        = path.join(DATA_DIR, 'meta.json')

// ── Server config ─────────────────────────────────────────────────────────────
const PORT      = Number(process.env.PORT || 3001)
const MAIL_FROM = 'zasemota@gmail.com'
const MAIL_TO   = 'zasemota@gmail.com'

// ── Data directory ─────────────────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

// ── Submissions store (in-memory + JSON file) ─────────────────────────────────
let submissions = []

function loadSubmissions() {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE))
      submissions = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'))
  } catch (err) {
    console.error('[submissions] Load failed:', err.message)
    submissions = []
  }
}

function saveSubmissions() {
  try { fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2)) }
  catch (err) { console.error('[submissions] Save failed:', err.message) }
}

loadSubmissions()

// ── Meta store ─────────────────────────────────────────────────────────────────
function loadMeta() {
  try {
    if (fs.existsSync(META_FILE)) return JSON.parse(fs.readFileSync(META_FILE, 'utf8'))
  } catch {}
  return { lastRefreshed: null }
}
function saveMeta(data) {
  try { fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2)) } catch {}
}

// ── Haversine distance (meters) ───────────────────────────────────────────────
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R    = 6_371_000
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── CSV line parser ───────────────────────────────────────────────────────────
function parseCSVLine(line) {
  const fields = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') inQ = false
      else cur += ch
    } else {
      if (ch === '"') inQ = true
      else if (ch === ',') { fields.push(cur); cur = '' }
      else cur += ch
    }
  }
  fields.push(cur)
  return fields
}

// ── Category → 311 service-type mapping ──────────────────────────────────────
// Keys cover both IssueCategory strings (from mobile) and short catIds
const CAT_TO_311 = {
  'Pothole':             ['Pothole'],
  'Streetlight Outage':  ['Streetlight Outage'],
  'Graffiti':            ['Graffiti'],
  'Illegal Dumping':     ['Illegal Dumping'],
  'Vehicle Concerns':    ['Vehicle Concerns', 'Abandoned Vehicle'],
  'Encampment':          ['Encampment Concerns'],
  'Encampment Concerns': ['Encampment Concerns'],
  'Junk Pickup':         ['Junk pickup'],
  'Container Issues':    ['Container Issues'],
  junk:                  ['Junk pickup'],
  graffiti:              ['Graffiti'],
  dumping:               ['Illegal Dumping'],
  pothole:               ['Pothole'],
  light:                 ['Streetlight Outage'],
  streetlight:           ['Streetlight Outage'],
  vehicle:               ['Vehicle Concerns', 'Abandoned Vehicle'],
  encampment:            ['Encampment Concerns'],
  container:             ['Container Issues'],
}

function map311Status(status311) {
  if (status311 === 'In Progress') return 'In Progress'
  if (status311 === 'Closed')      return 'Resolved'
  return 'Received'   // 'Open' or anything else
}

// ── Load 2026 CSV rows (for matching only — filtered to geolocated records) ───
function load2026CSVForMatching() {
  return new Promise((resolve) => {
    if (!fs.existsSync(CSV_2026)) return resolve([])
    const rows = []
    const rl = readline.createInterface({
      input: fs.createReadStream(CSV_2026, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    })
    let isHeader = true
    rl.on('line', line => {
      if (isHeader) { isHeader = false; return }
      if (!line.trim()) return
      const f       = parseCSVLine(line)
      const lat     = parseFloat(f[5])
      const lon     = parseFloat(f[6])
      const created = new Date(f[7])
      if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && !isNaN(created.getTime())) {
        rows.push({
          incidentId:  f[0]?.trim(),
          status:      f[1]?.trim(),
          serviceType: f[4]?.trim(),
          lat, lon, created,
        })
      }
    })
    rl.on('close', () => resolve(rows))
    rl.on('error', () => resolve([]))
  })
}

// ── Matching job ──────────────────────────────────────────────────────────────
async function runMatchingJob() {
  console.log('[matching] Starting…')
  if (submissions.length === 0) { console.log('[matching] No submissions'); return }

  const rows311 = await load2026CSVForMatching()
  if (rows311.length === 0) { console.log('[matching] No CSV rows'); return }

  const now              = Date.now()
  const FOURTEEN_DAYS    = 14 * 24 * 60 * 60 * 1000
  const FORTY_EIGHT_HRS  = 48 * 60 * 60 * 1000
  const DIST_THRESHOLD   = 150   // metres
  let matched = 0, updated = 0

  for (const sub of submissions) {
    if (now - new Date(sub.submittedAt).getTime() > FOURTEEN_DAYS) continue

    if (!sub.matched311Id) {
      // Fresh submission: attempt match
      if (!sub.lat || !sub.lon) continue
      const serviceTypes = CAT_TO_311[sub.category] ?? []
      if (serviceTypes.length === 0) continue

      const subMs    = new Date(sub.submittedAt).getTime()
      let bestRow    = null
      let bestDist   = Infinity

      for (const row of rows311) {
        if (!serviceTypes.includes(row.serviceType)) continue
        if (Math.abs(row.created.getTime() - subMs) > FORTY_EIGHT_HRS) continue
        const dist = haversineMeters(sub.lat, sub.lon, row.lat, row.lon)
        if (dist <= DIST_THRESHOLD && dist < bestDist) {
          bestDist = dist
          bestRow  = row
        }
      }

      if (bestRow) {
        sub.matched311Id     = bestRow.incidentId
        sub.status           = map311Status(bestRow.status)
        sub.lastStatusUpdate = new Date().toISOString()
        matched++
        console.log(`[matching] ${sub.id} → #${bestRow.incidentId} (${bestDist.toFixed(0)}m, ${bestRow.status})`)
      }

    } else {
      // Already matched: check if 311 status changed
      const row = rows311.find(r => r.incidentId === sub.matched311Id)
      if (!row) continue
      const newStatus = map311Status(row.status)
      if (newStatus !== sub.status) {
        console.log(`[matching] ${sub.id} status: ${sub.status} → ${newStatus}`)
        sub.status           = newStatus
        sub.lastStatusUpdate = new Date().toISOString()
        updated++
      }
    }
  }

  saveSubmissions()
  console.log(`[matching] Done: ${matched} new matches, ${updated} status updates (${rows311.length} rows scanned)`)
}

// ── Download file with redirect following ────────────────────────────────────
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const tmp = dest + '.tmp'

    const request = (currentUrl) => {
      https.get(currentUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          res.resume()
          const next = res.headers.location
          if (!next) return reject(new Error('Redirect missing Location header'))
          return request(next)
        }
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`HTTP ${res.statusCode} from ${currentUrl}`))
        }
        const file = fs.createWriteStream(tmp)
        res.pipe(file)
        file.on('finish', () => file.close(err => {
          if (err) { fs.unlink(tmp, () => {}); return reject(err) }
          fs.rename(tmp, dest, err2 => err2 ? reject(err2) : resolve())
        }))
        file.on('error', err => { fs.unlink(tmp, () => {}); reject(err) })
      }).on('error', reject)
    }

    request(url)
  })
}

// ── Run a build script ────────────────────────────────────────────────────────
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`[refresh] Running ${path.basename(scriptPath)}…`)
    execFile('node', [scriptPath], { timeout: 15 * 60 * 1000 }, (err, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout)
      if (stderr) process.stderr.write(stderr)
      if (err) return reject(err)
      resolve()
    })
  })
}

// ── Daily refresh ─────────────────────────────────────────────────────────────
async function runDailyRefresh() {
  console.log(`\n[refresh] Starting at ${new Date().toISOString()}`)

  try {
    console.log('[refresh] Downloading 2026 CSV…')
    await downloadFile(CSV_DOWNLOAD_URL, CSV_2026)
    console.log('[refresh] CSV downloaded')
  } catch (err) {
    console.error('[refresh] Download failed — keeping existing file:', err.message)
    return
  }

  try {
    await runScript(SCRIPT_V1)
  } catch (err) {
    console.error('[refresh] buildDashboard311.js failed:', err.message)
    return
  }

  try {
    await runScript(SCRIPT_V2)
  } catch (err) {
    console.error('[refresh] buildDashboard311v2.js failed:', err.message)
    return
  }

  saveMeta({ lastRefreshed: new Date().toISOString() })
  console.log(`[refresh] Refresh complete at ${new Date().toISOString()}`)

  await runMatchingJob()
}

// ── Cron: 6 AM Pacific daily ──────────────────────────────────────────────────
cron.schedule('0 6 * * *', runDailyRefresh, { timezone: 'America/Los_Angeles' })
console.log('[cron] Daily refresh scheduled at 6 AM Pacific (America/Los_Angeles)')

// ── Express app ───────────────────────────────────────────────────────────────
const app = express()
app.use(cors({ origin: true, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }))
app.use(express.json({ limit: '256kb' }))

// ── Dashboard endpoints ───────────────────────────────────────────────────────
app.get('/api/dashboard/v1', (req, res) => {
  if (!fs.existsSync(DASHBOARD_V1))
    return res.status(404).json({ ok: false, error: 'dashboard311.json not found' })
  res.sendFile(DASHBOARD_V1)
})

app.get('/api/dashboard/v2', (req, res) => {
  if (!fs.existsSync(DASHBOARD_V2))
    return res.status(404).json({ ok: false, error: 'dashboard311v2.json not found' })
  res.sendFile(DASHBOARD_V2)
})

app.get('/api/dashboard/meta', (req, res) => {
  const meta = loadMeta()
  let currentMonth = null
  try {
    if (fs.existsSync(DASHBOARD_V2)) {
      const v2 = JSON.parse(fs.readFileSync(DASHBOARD_V2, 'utf8'))
      currentMonth = v2?.meta?.currentMonth ?? null
    }
  } catch {}
  res.json({ lastRefreshed: meta.lastRefreshed, currentMonth })
})

// ── Submission endpoints ──────────────────────────────────────────────────────
app.post('/api/submissions', (req, res) => {
  const { id, lat, lon, category, submittedAt } = req.body || {}

  if (typeof category !== 'string') {
    return res.status(400).json({ ok: false, error: 'category is required' })
  }

  const entry = {
    id:               id ?? crypto.randomUUID(),
    lat:              typeof lat === 'number' ? lat : null,
    lon:              typeof lon === 'number' ? lon : null,
    category,
    submittedAt:      submittedAt ?? new Date().toISOString(),
    status:           'Submitted',
    matched311Id:     null,
    lastStatusUpdate: new Date().toISOString(),
  }

  submissions.push(entry)
  saveSubmissions()
  console.log(`[submissions] Created ${entry.id} (${category})`)
  res.status(201).json({ ok: true, submission: entry })
})

app.get('/api/submissions/:id/status', (req, res) => {
  const sub = submissions.find(s => s.id === req.params.id)
  if (!sub) return res.status(404).json({ ok: false, error: 'Submission not found' })
  res.json({
    ok:               true,
    id:               sub.id,
    status:           sub.status,
    matched311Id:     sub.matched311Id,
    submittedAt:      sub.submittedAt,
    lastStatusUpdate: sub.lastStatusUpdate,
  })
})

// ── Existing: email report ────────────────────────────────────────────────────
const buildEmailContent = (payload) => {
  const { category, tag, desc, locationMain, locationSub } = payload
  const subject = `City issue report — ${tag}`
  const text = [
    `Category: ${category}`,
    `Issue type: ${tag}`,
    '',
    'Description:',
    desc,
    '',
    'Location:',
    locationMain,
    locationSub,
  ].join('\n')
  return { subject, text }
}

const hasGmailOAuthConfig = () => {
  const id      = process.env.GMAIL_OAUTH_CLIENT_ID     && String(process.env.GMAIL_OAUTH_CLIENT_ID).trim()
  const secret  = process.env.GMAIL_OAUTH_CLIENT_SECRET && String(process.env.GMAIL_OAUTH_CLIENT_SECRET).trim()
  const refresh = process.env.GMAIL_OAUTH_REFRESH_TOKEN && String(process.env.GMAIL_OAUTH_REFRESH_TOKEN).trim()
  return Boolean(id && secret && refresh)
}

const createGmailOAuthTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: {
      type:         'OAuth2',
      user:         MAIL_FROM,
      clientId:     process.env.GMAIL_OAUTH_CLIENT_ID.trim(),
      clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET.trim(),
      refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN.trim(),
    },
  })

const hasSmtpConfig = () => {
  if (process.env.SMTP_URL && String(process.env.SMTP_URL).trim()) return true
  return Boolean(
    process.env.SMTP_HOST && String(process.env.SMTP_HOST).trim() &&
    process.env.SMTP_USER && String(process.env.SMTP_USER).trim() &&
    process.env.SMTP_PASS && String(process.env.SMTP_PASS).trim(),
  )
}

const createSmtpTransporter = () => {
  if (process.env.SMTP_URL && String(process.env.SMTP_URL).trim())
    return nodemailer.createTransport(process.env.SMTP_URL)
  const port = Number(process.env.SMTP_PORT || 587)
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port,
    secure: port === 465 || process.env.SMTP_SECURE === 'true',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

app.post('/api/report-different-issue', async (req, res) => {
  const { category, tag, desc, locationMain, locationSub } = req.body || {}
  if (
    typeof category     !== 'string' ||
    typeof tag          !== 'string' ||
    typeof desc         !== 'string' ||
    typeof locationMain !== 'string' ||
    typeof locationSub  !== 'string'
  ) {
    return res.status(400).json({
      ok: false,
      error: 'Expected JSON body: { category, tag, desc, locationMain, locationSub } (all strings)',
    })
  }

  const { subject, text } = buildEmailContent({ category, tag, desc, locationMain, locationSub })

  if (hasGmailOAuthConfig()) {
    try {
      const info = await createGmailOAuthTransporter().sendMail({ from: MAIL_FROM, to: MAIL_TO, subject, text })
      console.log('[report-different-issue] Gmail OAuth ok', info.messageId)
      return res.status(200).json({ ok: true, mode: 'gmail-oauth' })
    } catch (err) {
      console.error('[report-different-issue] Gmail OAuth error:', err)
      return res.status(500).json({ ok: false, error: err.message || String(err) })
    }
  }

  if (!hasSmtpConfig()) {
    console.log('[report-different-issue] mode=log\n', { from: MAIL_FROM, to: MAIL_TO, subject, text })
    return res.status(200).json({ ok: true, mode: 'log' })
  }

  try {
    const info = await createSmtpTransporter().sendMail({ from: MAIL_FROM, to: MAIL_TO, subject, text })
    console.log('[report-different-issue] SMTP ok', info.messageId)
    return res.status(200).json({ ok: true, mode: 'smtp' })
  } catch (err) {
    console.error('[report-different-issue] SMTP error:', err)
    return res.status(500).json({ ok: false, error: err.message || String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`Report server listening on http://127.0.0.1:${PORT}`)
})
