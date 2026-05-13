#!/usr/bin/env node
/**
 * Processes SJ 311 CSV files and outputs a dashboard-ready JSON file.
 *
 * Input:  mobile/src/data/SJ311_2017to20260512/*.csv
 *         scripts/sj-council-districts.geojson
 * Output: mobile/src/data/dashboard311.json
 *         mobile/src/data/dashboard311.ts  (TypeScript re-export)
 *
 * Run:    node scripts/buildDashboard311.js
 */

const fs       = require('fs')
const path     = require('path')
const readline = require('readline')
const https    = require('https')

// ── Paths ─────────────────────────────────────────────────────────────────────
const CSV_DIR  = path.join(__dirname, '../mobile/src/data/SJ311_2017to20260512')
const GEO_FILE = path.join(__dirname, 'sj-council-districts.geojson')
const OUT_JSON = path.join(__dirname, '../mobile/src/data/dashboard311.json')
const OUT_TS   = path.join(__dirname, '../mobile/src/data/dashboard311.ts')

// ── Period constants ──────────────────────────────────────────────────────────
const ALL_YEARS    = [2017,2018,2019,2020,2021,2022,2023,2024,2025,2026]
const CURRENT_YM   = '2026-04'
const PRIOR_YM     = '2026-03'
const CURRENT_YEAR = 2026
const PRIOR_YEAR   = 2025
const YTD_MONTHS   = [1, 2, 3, 4]

// ── SJ bounding box ───────────────────────────────────────────────────────────
const LAT_MIN = 37.1, LAT_MAX = 37.5
const LON_MIN = -122.1, LON_MAX = -121.7

// ── Service-type mapping ──────────────────────────────────────────────────────
const TYPE_MAP = {
  'Junk pickup':         'junk',
  'Graffiti':            'graffiti',
  'Streetlight Outage':  'streetlight',
  'Illegal Dumping':     'dumping',
  'Vehicle Concerns':    'vehicle',
  'Abandoned Vehicle':   'vehicle',
  'Container Issues':    'container',
  'Encampment Concerns': 'encampment',
  'Pothole':             'pothole',
}

const TYPE_IDS = ['junk','graffiti','streetlight','dumping','vehicle','container','encampment','pothole']

// coordinateEstimated: these types have no GPS coordinates; counts are distributed by population
const TYPE_META = {
  junk:        { name: 'Junk Pickup',         icon: '🗑️', iconBg: 'rgba(240,160,48,0.18)',  coordinateEstimated: true  },
  graffiti:    { name: 'Graffiti',            icon: '🎨', iconBg: 'rgba(62,207,130,0.18)',  coordinateEstimated: false },
  streetlight: { name: 'Streetlight Outage',  icon: '💡', iconBg: 'rgba(91,155,248,0.18)',  coordinateEstimated: false },
  dumping:     { name: 'Illegal Dumping',     icon: '🚯', iconBg: 'rgba(240,160,48,0.18)',  coordinateEstimated: false },
  vehicle:     { name: 'Vehicle Concerns',    icon: '🚗', iconBg: 'rgba(232,81,74,0.18)',   coordinateEstimated: false },
  container:   { name: 'Container Issues',    icon: '📦', iconBg: 'rgba(240,160,48,0.18)',  coordinateEstimated: true  },
  encampment:  { name: 'Encampment Concerns', icon: '⛺', iconBg: 'rgba(167,139,250,0.18)', coordinateEstimated: false },
  pothole:     { name: 'Pothole',             icon: '🛣️', iconBg: 'rgba(232,81,74,0.18)',   coordinateEstimated: false },
}

// For ungeolocated types, getTypeDays() falls back to citywide resolution arrays
const UNGEOLOCATED_TYPES = new Set(['junk', 'container'])

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Nominatim reverse geocoding ───────────────────────────────────────────────
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

function reverseGeocode(lat, lon) {
  return new Promise(resolve => {
    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: `/reverse?format=json&lat=${lat}&lon=${lon}&zoom=17&addressdetails=1`,
      headers: { 'User-Agent': 'CityFix-SJ-Dashboard/1.0 (educational project)' },
    }
    const req = https.get(options, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch { resolve(null) } })
    })
    req.on('error', () => resolve(null))
  })
}

function formatAddress(result) {
  if (!result || !result.address) return null
  const a = result.address
  const road = a.road || a.pedestrian || a.path || a.footway || null
  const area  = a.neighbourhood || a.suburb || a.quarter || null
  if (road && area) return `${road}, ${area}`
  if (road) return `${road}, San Jose`
  return null
}

// ── Geometry: Point-in-Polygon (ray-casting) ──────────────────────────────────
function pointInRing(lat, lon, ring) {
  let inside = false, n = ring.length, j = n - 1
  for (let i = 0; i < n; i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi))
      inside = !inside
    j = i
  }
  return inside
}

function pointInGeometry(lat, lon, geom) {
  if (geom.type === 'Polygon') {
    if (!pointInRing(lat, lon, geom.coordinates[0])) return false
    for (let i = 1; i < geom.coordinates.length; i++)
      if (pointInRing(lat, lon, geom.coordinates[i])) return false
    return true
  }
  if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      if (pointInRing(lat, lon, poly[0])) {
        let inHole = false
        for (let i = 1; i < poly.length; i++)
          if (pointInRing(lat, lon, poly[i])) { inHole = true; break }
        if (!inHole) return true
      }
    }
    return false
  }
  return false
}

// ── Spatial grid (0.005° cells) ───────────────────────────────────────────────
const GRID_STEP = 0.005
const GRID_NLAT = Math.ceil((LAT_MAX - LAT_MIN) / GRID_STEP)
const GRID_NLON = Math.ceil((LON_MAX - LON_MIN) / GRID_STEP)
const districtGrid = new Uint8Array(GRID_NLAT * GRID_NLON)

function buildGrid(features) {
  console.log('Building spatial grid…')
  for (let li = 0; li < GRID_NLAT; li++) {
    for (let lni = 0; lni < GRID_NLON; lni++) {
      const lat = LAT_MIN + (li + 0.5) * GRID_STEP
      const lon = LON_MIN + (lni + 0.5) * GRID_STEP
      for (const f of features) {
        if (pointInGeometry(lat, lon, f.geometry)) {
          districtGrid[li * GRID_NLON + lni] = f.properties.DISTRICTINT
          break
        }
      }
    }
  }
  console.log('Grid built.')
}

function lookupDistrict(lat, lon) {
  if (lat < LAT_MIN || lat > LAT_MAX || lon < LON_MIN || lon > LON_MAX) return 0
  const li  = Math.min(GRID_NLAT - 1, Math.floor((lat - LAT_MIN) / GRID_STEP))
  const lni = Math.min(GRID_NLON - 1, Math.floor((lon - LON_MIN) / GRID_STEP))
  return districtGrid[li * GRID_NLON + lni]
}

// ── Known 311-system artifact coordinates ─────────────────────────────────────
// These are the 311 system's internal default drop points for unlocated records.
// Identified by auditing all CSVs: ≥86% of records at these coords are "Other Issues",
// which are unclassified/unlocated tickets defaulting to a system center point.
// Filtered from chronic spot computation only — general stats are unaffected.
const ARTIFACT_COORDS = new Set([
  '37.338,-121.886',  // D3 system default — 15,921 Other / 17,603 total (90%)
  '37.321,-121.876',  // artifact cluster — 2,610 Other / 2,703 total (97%)
  '37.338,-121.885',  // D3 system default variant — 2,171 Other / 2,345 total (93%)
  '37.346,-121.885',  // artifact cluster — 1,073 Other / 1,244 total (86%)
  '37.274,-121.903',  // D9 dense cluster — 31,526 total (40-50× real chronic spots)
  '37.279,-121.901',  // D9 dense cluster — 15,929 total (vehicle:14,729)
  '37.274,-121.904',  // D9 dense cluster — 7,684 total
  '37.273,-121.903',  // D9 dense cluster — 3,201 total
])

function isArtifactCoord(lat, lon) {
  return ARTIFACT_COORDS.has(`${lat.toFixed(3)},${lon.toFixed(3)}`)
}

// ── CSV parsing ───────────────────────────────────────────────────────────────
function parseCSVLine(line) {
  const fields = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"' && line[i+1] === '"') { cur += '"'; i++ }
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

function parseDate(raw) {
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function ymKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ── Population weights ────────────────────────────────────────────────────────
let districtPopShare = {}

function loadPopulationShares(features) {
  const pop = {}
  let total = 0
  for (const f of features) {
    const d = f.properties.DISTRICTINT
    const p = parseInt(f.properties.POPULATION, 10) || 0
    pop[d] = p; total += p
  }
  for (let d = 1; d <= 10; d++) districtPopShare[d] = (pop[d] ?? 0) / (total || 1)
}

// ── Median helpers ────────────────────────────────────────────────────────────
function median(arr) {
  if (!arr || arr.length === 0) return null
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function fmtMedianDays(arr) {
  if (!arr || arr.length < MIN_CLOSED_FOR_AVG) return '—'
  const med = median(arr)
  if (med === null) return '—'
  if (med < 1/24) return '< 1 hour'
  if (med < 2) {
    const hrs = Math.round(med * 24)
    return hrs === 1 ? '1 hour' : `${hrs} hours`
  }
  return `${Math.round(med)} days`
}

function safeMedian(arr) {
  if (!arr || arr.length < MIN_CLOSED_FOR_AVG) return null
  return median(arr)
}

// ── Seasonal peak ─────────────────────────────────────────────────────────────
const monthTypeCount = {}
for (const t of TYPE_IDS) monthTypeCount[t] = new Array(13).fill(0)

function peakMonth(typeId) {
  const counts = monthTypeCount[typeId]
  let maxM = 0, maxV = 0
  for (let m = 1; m <= 12; m++) if (counts[m] > maxV) { maxV = counts[m]; maxM = m }
  const avg = counts.slice(1).reduce((s, v) => s + v, 0) / 12
  if (maxM === 0 || maxV < avg * 1.2) return null
  return MONTH_NAMES[maxM]
}

// ── Count accumulators ────────────────────────────────────────────────────────
const distStats     = {}  // [d][ym]      = { total, closed, open }
const yearStats     = {}  // [d][year]    = { total, closed, open }
const typeStats     = {}  // [d][ym][t]   = { total, closed }
const typeYearStats = {}  // [d][year][t] = { total, closed }

// ── Resolution day arrays (exact values; median computed at output time) ───────
const resolveDaysDistYM   = {}  // [d][ym]          = number[]
const resolveDaysDistYear = {}  // [d][year]         = number[]
const resolveDaysTypeYM   = {}  // [d or 'cw'][ym][t] = number[]

// ── Auto-close detection ──────────────────────────────────────────────────────
let autoCloseFlags = new Set()  // "typeId:ym" — months flagged as auto-closed (>70% sub-hour)
const MIN_CLOSED_FOR_AVG = 50

// ── Chronic spot accumulators ─────────────────────────────────────────────────
// chronicMap[d][key][typeId] = { total, years: Set<number>, firstYear }
const chronicMap = {}
// chronicSequences[d][key] = [{date: number, status: string}]
const chronicSequences = {}

function getDS(d, ym) {
  if (!distStats[d])     distStats[d] = {}
  if (!distStats[d][ym]) distStats[d][ym] = { total:0, closed:0, open:0 }
  return distStats[d][ym]
}
function getYS(d, y) {
  if (!yearStats[d])    yearStats[d] = {}
  if (!yearStats[d][y]) yearStats[d][y] = { total:0, closed:0, open:0 }
  return yearStats[d][y]
}
function getTS(d, ym, t) {
  if (!typeStats[d])        typeStats[d] = {}
  if (!typeStats[d][ym])    typeStats[d][ym] = {}
  if (!typeStats[d][ym][t]) typeStats[d][ym][t] = { total:0, closed:0 }
  return typeStats[d][ym][t]
}
function getTYS(d, y, t) {
  if (!typeYearStats[d])       typeYearStats[d] = {}
  if (!typeYearStats[d][y])    typeYearStats[d][y] = {}
  if (!typeYearStats[d][y][t]) typeYearStats[d][y][t] = { total:0, closed:0 }
  return typeYearStats[d][y][t]
}

function pushDistDays(d, ym, year, days) {
  if (!resolveDaysDistYM[d])      resolveDaysDistYM[d] = {}
  if (!resolveDaysDistYM[d][ym])  resolveDaysDistYM[d][ym] = []
  resolveDaysDistYM[d][ym].push(days)

  if (!resolveDaysDistYear[d])        resolveDaysDistYear[d] = {}
  if (!resolveDaysDistYear[d][year])  resolveDaysDistYear[d][year] = []
  resolveDaysDistYear[d][year].push(days)
}

function pushTypeDays(d, ym, typeId, days) {
  if (!resolveDaysTypeYM[d])              resolveDaysTypeYM[d] = {}
  if (!resolveDaysTypeYM[d][ym])          resolveDaysTypeYM[d][ym] = {}
  if (!resolveDaysTypeYM[d][ym][typeId])  resolveDaysTypeYM[d][ym][typeId] = []
  resolveDaysTypeYM[d][ym][typeId].push(days)
}

// ── Process one CSV row ───────────────────────────────────────────────────────
function processRow(fields) {
  const status      = fields[1]?.trim()
  const serviceType = fields[4]?.trim() || ''
  const latStr      = fields[5]?.trim()
  const lonStr      = fields[6]?.trim()
  const createdRaw  = fields[7]?.trim()
  const updatedRaw  = fields[8]?.trim()

  const created = parseDate(createdRaw)
  if (!created) return

  const year  = created.getFullYear()
  const month = created.getMonth() + 1
  const ym    = ymKey(created)

  const isClosed = status === 'Closed'
  const isOpen   = status === 'Open' || status === 'In Progress'

  let resDays = null
  if (isClosed) {
    const updated = parseDate(updatedRaw)
    if (updated && updated >= created) {
      const days = (updated - created) / (1000 * 60 * 60 * 24)
      if (days >= 0 && days <= 365) resDays = days
    }
  }

  const typeId = TYPE_MAP[serviceType] || null

  // ── Citywide ──────────────────────────────────────────────────────────────
  getDS('cw', ym).total++
  if (isClosed) getDS('cw', ym).closed++
  if (isOpen)   getDS('cw', ym).open++
  getYS('cw', year).total++
  if (isClosed) getYS('cw', year).closed++
  if (isOpen)   getYS('cw', year).open++

  if (typeId) {
    getTS('cw', ym, typeId).total++
    if (isClosed) {
      getTS('cw', ym, typeId).closed++
      if (resDays !== null) pushTypeDays('cw', ym, typeId, resDays)
    }
    getTYS('cw', year, typeId).total++
    if (isClosed) getTYS('cw', year, typeId).closed++
    monthTypeCount[typeId][month]++
  }

  // ── District assignment ───────────────────────────────────────────────────
  const lat = parseFloat(latStr)
  const lon = parseFloat(lonStr)
  const hasCoords = !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0
  const district  = hasCoords ? lookupDistrict(lat, lon) : 0
  if (district === 0) return

  // ── Per-district stats ────────────────────────────────────────────────────
  getDS(district, ym).total++
  if (isClosed) getDS(district, ym).closed++
  if (isOpen)   getDS(district, ym).open++
  getYS(district, year).total++
  if (isClosed) getYS(district, year).closed++
  if (isOpen)   getYS(district, year).open++

  if (typeId) {
    getTS(district, ym, typeId).total++
    if (isClosed) {
      getTS(district, ym, typeId).closed++
      if (resDays !== null) pushTypeDays(district, ym, typeId, resDays)
    }
    getTYS(district, year, typeId).total++
    if (isClosed) getTYS(district, year, typeId).closed++

    // Chronic spot tracking — skip known 311-system artifact coordinates
    if (!isArtifactCoord(lat, lon)) {
      const key = `${lat.toFixed(3)},${lon.toFixed(3)}`
      if (!chronicMap[district])              chronicMap[district] = {}
      if (!chronicMap[district][key])         chronicMap[district][key] = {}
      if (!chronicMap[district][key][typeId]) {
        chronicMap[district][key][typeId] = { total:0, years: new Set(), firstYear: year }
      }
      const c = chronicMap[district][key][typeId]
      c.total++
      c.years.add(year)
      if (year < c.firstYear) c.firstYear = year

      if (!chronicSequences[district])      chronicSequences[district] = {}
      if (!chronicSequences[district][key]) chronicSequences[district][key] = []
      chronicSequences[district][key].push({ date: created.getTime(), status, typeId, resolutionDays: resDays })
    }
  }
}

// ── Stream a CSV file ─────────────────────────────────────────────────────────
function processFile(filePath) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    })
    let isHeader = true, rows = 0
    rl.on('line', line => {
      if (isHeader) { isHeader = false; return }
      if (!line.trim()) return
      processRow(parseCSVLine(line))
      rows++
    })
    rl.on('close', () => { console.log(`  ${path.basename(filePath)}: ${rows.toLocaleString()} rows`); resolve() })
    rl.on('error', reject)
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function rate(closed, total) {
  return total > 0 ? Math.round((closed / total) * 100) : 0
}

function sumTypeYM(d, yms, t) {
  const acc = { total:0, closed:0 }
  for (const ym of yms) {
    const s = typeStats[d]?.[ym]?.[t]
    if (s) { acc.total += s.total; acc.closed += s.closed }
  }
  return acc
}

function sumDistYM(d, yms) {
  const acc = { total:0, closed:0, open:0 }
  for (const ym of yms) {
    const s = distStats[d]?.[ym]
    if (s) { acc.total += s.total; acc.closed += s.closed; acc.open += s.open }
  }
  return acc
}

function ymList(year, months) {
  return months.map(m => `${year}-${String(m).padStart(2, '0')}`)
}

function getDistDays(d, yms) {
  const arr = []
  for (const ym of yms) {
    const src = resolveDaysDistYM[d]?.[ym]
    if (src) arr.push(...src)
  }
  return arr
}

// For ungeolocated types (junk, container), fall back to citywide resolution arrays
function getTypeDays(d, yms, typeId) {
  const src = UNGEOLOCATED_TYPES.has(typeId) ? 'cw' : d
  const arr = []
  for (const ym of yms) {
    if (autoCloseFlags.has(`${typeId}:${ym}`)) continue
    const a = resolveDaysTypeYM[src]?.[ym]?.[typeId]
    if (a) arr.push(...a)
  }
  return arr
}

// ── Avg time label with reason for missing data ───────────────────────────────
function avgTimeLabelType(d, yms, typeId) {
  const src = UNGEOLOCATED_TYPES.has(typeId) ? 'cw' : d
  let hasAutoClosedData = false
  for (const ym of yms) {
    if (autoCloseFlags.has(`${typeId}:${ym}`)) {
      const raw = resolveDaysTypeYM[src]?.[ym]?.[typeId]
      if (raw && raw.length > 0) { hasAutoClosedData = true; break }
    }
  }
  const arr = getTypeDays(d, yms, typeId)
  if (arr.length >= MIN_CLOSED_FOR_AVG) return fmtMedianDays(arr)
  if (hasAutoClosedData) return 'Auto-closed by city'
  return 'Not enough data'
}

function avgTimeLabelDist(d, yms) {
  let hasAutoClosedData = false
  outer: for (const ym of yms) {
    for (const typeId of TYPE_IDS) {
      if (UNGEOLOCATED_TYPES.has(typeId)) continue
      if (autoCloseFlags.has(`${typeId}:${ym}`)) {
        const raw = resolveDaysTypeYM[d]?.[ym]?.[typeId]
        if (raw && raw.length > 0) { hasAutoClosedData = true; break outer }
      }
    }
  }
  const arr = getDistDays(d, yms)
  if (arr.length >= MIN_CLOSED_FOR_AVG) return fmtMedianDays(arr)
  if (hasAutoClosedData) return 'Auto-closed by city'
  return 'Not enough data'
}

// ── Distribute ungeolocated types across districts by population ──────────────
function distributeUngeolocated() {
  const allYMs = ALL_YEARS.flatMap(y =>
    [1,2,3,4,5,6,7,8,9,10,11,12].map(m => `${y}-${String(m).padStart(2,'0')}`)
  )
  for (const t of TYPE_IDS) {
    let geoTotal = 0
    for (let d = 1; d <= 10; d++)
      for (const ym of allYMs)
        geoTotal += typeStats[d]?.[ym]?.[t]?.total ?? 0
    const cwTotal = allYMs.reduce((s, ym) => s + (typeStats['cw']?.[ym]?.[t]?.total ?? 0), 0)
    if (cwTotal === 0) continue
    if (geoTotal / cwTotal > 0.10) continue

    console.log(`  Distributing ${t} by population (${Math.round(geoTotal/cwTotal*100)}% geolocated)`)

    for (let d = 1; d <= 10; d++) {
      const share = districtPopShare[d]
      for (const ym of allYMs) {
        const cw = typeStats['cw']?.[ym]?.[t]
        if (!cw || cw.total === 0) continue
        const s = getTS(d, ym, t)
        s.total  += Math.round(cw.total  * share)
        s.closed += Math.round(cw.closed * share)
      }
      for (const y of ALL_YEARS) {
        const cwy = typeYearStats['cw']?.[y]?.[t]
        if (!cwy || cwy.total === 0) continue
        const s = getTYS(d, y, t)
        s.total  += Math.round(cwy.total  * share)
        s.closed += Math.round(cwy.closed * share)
      }
    }
  }
}

// ── Auto-close detection and district resolution array construction ────────────
function detectAutoCloseFlags() {
  const AUTO_CLOSE_THRESHOLD = 0.70
  const MIN_RECORDS_FOR_FLAG = 10
  let flagCount = 0
  const ymMap = resolveDaysTypeYM['cw'] ?? {}
  for (const ym of Object.keys(ymMap)) {
    for (const typeId of TYPE_IDS) {
      const arr = ymMap[ym]?.[typeId]
      if (!arr || arr.length < MIN_RECORDS_FOR_FLAG) continue
      const subHour = arr.filter(d => d < 1 / 24).length
      if (subHour / arr.length > AUTO_CLOSE_THRESHOLD) {
        autoCloseFlags.add(`${typeId}:${ym}`)
        flagCount++
      }
    }
  }
  console.log(`  Auto-close flags: ${flagCount} type+month combos (>70% sub-hour closures)`)
  for (const flag of [...autoCloseFlags].sort()) console.log(`    ${flag}`)
}

function buildDistResolutionArrays() {
  const allYMs = ALL_YEARS.flatMap(y =>
    [1,2,3,4,5,6,7,8,9,10,11,12].map(m => `${y}-${String(m).padStart(2,'0')}`)
  )
  for (const d of [1,2,3,4,5,6,7,8,9,10,'cw']) {
    for (const ym of allYMs) {
      const year = parseInt(ym.slice(0, 4))
      for (const typeId of TYPE_IDS) {
        if (d !== 'cw' && UNGEOLOCATED_TYPES.has(typeId)) continue
        if (autoCloseFlags.has(`${typeId}:${ym}`)) continue
        const arr = resolveDaysTypeYM[d]?.[ym]?.[typeId]
        if (!arr || arr.length === 0) continue
        if (!resolveDaysDistYM[d])      resolveDaysDistYM[d] = {}
        if (!resolveDaysDistYM[d][ym])  resolveDaysDistYM[d][ym] = []
        resolveDaysDistYM[d][ym].push(...arr)
        if (!resolveDaysDistYear[d])        resolveDaysDistYear[d] = {}
        if (!resolveDaysDistYear[d][year])  resolveDaysDistYear[d][year] = []
        resolveDaysDistYear[d][year].push(...arr)
      }
    }
  }
}

// ── Build summary card for a period ──────────────────────────────────────────
function buildSummary(d, period) {
  if (period === 'month') {
    const cur   = distStats[d]?.[CURRENT_YM] ?? { total:0, closed:0 }
    const prior = distStats[d]?.[PRIOR_YM]   ?? { total:0, closed:0 }
    const curRate   = rate(cur.closed, cur.total)
    const priorRate = rate(prior.closed, prior.total)
    const curDays   = safeMedian(getDistDays(d, [CURRENT_YM]))
    const priorDays = safeMedian(getDistDays(d, [PRIOR_YM]))
    return {
      resolutionRate:      curRate,
      resolutionRateDelta: curRate - priorRate,
      avgFixTimeLabel:     avgTimeLabelDist(d, [CURRENT_YM]),
      avgFixTimeDays:      curDays   !== null ? +curDays.toFixed(2)   : null,
      avgFixTimeDelta:     (curDays !== null && priorDays !== null) ? +(curDays - priorDays).toFixed(2) : null,
    }
  }

  if (period === 'year') {
    const curYTDyms   = ymList(CURRENT_YEAR, YTD_MONTHS)
    const priorYTDyms = ymList(PRIOR_YEAR,   YTD_MONTHS)
    const cur   = sumDistYM(d, curYTDyms)
    const prior = sumDistYM(d, priorYTDyms)
    const curRate   = rate(cur.closed, cur.total)
    const priorRate = rate(prior.closed, prior.total)
    const curDays   = safeMedian(getDistDays(d, curYTDyms))
    const priorDays = safeMedian(getDistDays(d, priorYTDyms))
    return {
      resolutionRate:      curRate,
      resolutionRateDelta: curRate - priorRate,
      avgFixTimeLabel:     avgTimeLabelDist(d, curYTDyms),
      avgFixTimeDays:      curDays   !== null ? +curDays.toFixed(2)   : null,
      avgFixTimeDelta:     (curDays !== null && priorDays !== null) ? +(curDays - priorDays).toFixed(2) : null,
    }
  }

  // all
  const allYms  = ALL_YEARS.flatMap(y => ymList(y, [1,2,3,4,5,6,7,8,9,10,11,12]))
  const yr17yms = ymList(2017, [1,2,3,4,5,6,7,8,9,10,11,12])
  const allDist   = sumDistYM(d, allYms)
  const dist2017  = sumDistYM(d, yr17yms)
  const allRate   = rate(allDist.closed, allDist.total)
  const rate2017  = rate(dist2017.closed, dist2017.total)
  const allDays   = safeMedian(getDistDays(d, allYms))
  const days2017  = safeMedian(getDistDays(d, yr17yms))
  return {
    resolutionRate:      allRate,
    resolutionRateDelta: allRate - rate2017,
    avgFixTimeLabel:     avgTimeLabelDist(d, allYms),
    avgFixTimeDays:      allDays  !== null ? +allDays.toFixed(2)  : null,
    avgFixTimeDelta:     (allDays !== null && days2017 !== null) ? +(allDays - days2017).toFixed(2) : null,
  }
}

// ── Build IssueType array for a district ──────────────────────────────────────
function buildIssueTypes(d) {
  const curYTDyms = ymList(CURRENT_YEAR, YTD_MONTHS)
  const allYMs    = ALL_YEARS.flatMap(y => ymList(y, [1,2,3,4,5,6,7,8,9,10,11,12]))

  return TYPE_IDS.map(t => {
    const curM   = typeStats[d]?.[CURRENT_YM]?.[t] ?? { total:0, closed:0 }
    const curYTD = sumTypeYM(d, curYTDyms, t)
    const allT   = sumTypeYM(d, allYMs, t)

    const sparkline        = ALL_YEARS.map(y => typeYearStats[d]?.[y]?.[t]?.total ?? 0)
    const monthlySparkline = YTD_MONTHS.map(m => {
      const ym = `${CURRENT_YEAR}-${String(m).padStart(2, '0')}`
      return typeStats[d]?.[ym]?.[t]?.total ?? 0
    })
    const firstYearIdx = sparkline.findIndex(v => v > 0)
    const firstYear    = firstYearIdx >= 0 ? 2017 + firstYearIdx : CURRENT_YEAR

    return {
      id:            t,
      ...TYPE_META[t],
      sparkline,
      monthlySparkline,
      peakMonth:     peakMonth(t),
      firstYear,
      countByPeriod: { month: curM.total, year: curYTD.total, all: allT.total },
      month: {
        resolvedPct:  rate(curM.closed, curM.total),
        avgTimeLabel: avgTimeLabelType(d, [CURRENT_YM], t),
      },
      year: {
        resolvedPct:  rate(curYTD.closed, curYTD.total),
        avgTimeLabel: avgTimeLabelType(d, curYTDyms, t),
      },
      all: {
        resolvedPct:  rate(allT.closed, allT.total),
        avgTimeLabel: avgTimeLabelType(d, allYMs, t),
      },
    }
  }).filter(it => it.countByPeriod.all > 0)
}

// ── Build independent trend arrays (>10% threshold, exclude prior=0) ──────────
function buildTrendsVsMonth(d) {
  return TYPE_IDS.flatMap(t => {
    const cur   = typeStats[d]?.[CURRENT_YM]?.[t]?.total ?? 0
    const prior = typeStats[d]?.[PRIOR_YM]?.[t]?.total   ?? 0
    if (prior === 0) return []
    const pct = Math.round(((cur - prior) / prior) * 100)
    if (Math.abs(pct) <= 10) return []
    return [{ name: TYPE_META[t].name, pct }]
  }).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
}

function buildTrendsVsYear(d) {
  const curYTDyms   = ymList(CURRENT_YEAR, YTD_MONTHS)
  const priorYTDyms = ymList(PRIOR_YEAR,   YTD_MONTHS)
  return TYPE_IDS.flatMap(t => {
    const cur   = sumTypeYM(d, curYTDyms,   t).total
    const prior = sumTypeYM(d, priorYTDyms, t).total
    if (prior === 0) return []
    const pct = Math.round(((cur - prior) / prior) * 100)
    if (Math.abs(pct) <= 10) return []
    return [{ name: TYPE_META[t].name, pct }]
  }).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
}

// ── Build sparklines ──────────────────────────────────────────────────────────
function buildSparklines(d) {
  const sparklineRate    = ALL_YEARS.map(y => { const s = yearStats[d]?.[y]; return s ? rate(s.closed, s.total) : 0 })
  const sparklineOpen    = ALL_YEARS.map(y => yearStats[d]?.[y]?.open ?? 0)
  const sparklineAvgDays = ALL_YEARS.map(y => {
    const arr = resolveDaysDistYear[d]?.[y]
    if (!arr || arr.length < MIN_CLOSED_FOR_AVG) return null
    const med = median(arr)
    return med !== null ? +med.toFixed(2) : null
  })
  return { sparklineRate, sparklineOpen, sparklineAvgDays }
}

// ── Build chronic spots for a district ───────────────────────────────────────
function buildChronicSpots(d) {
  const map = chronicMap[d] ?? {}

  // One entry per location — dominant type at each grid cell
  const locationEntries = []
  for (const [key, types] of Object.entries(map)) {
    let dominantType = null, dominantCount = 0
    let totalCount = 0, firstYear = Infinity
    const yearsSet = new Set()

    for (const [typeId, data] of Object.entries(types)) {
      totalCount += data.total
      if (data.total > dominantCount) { dominantCount = data.total; dominantType = typeId }
      if (data.firstYear < firstYear) firstYear = data.firstYear
      for (const y of data.years) yearsSet.add(y)
    }

    if (dominantType && totalCount >= 15 && totalCount <= 2000) {
      locationEntries.push({ key, dominantType, count: totalCount, firstYear, yearsSet })
    }
  }

  locationEntries.sort((a, b) => b.count - a.count)

  // Type diversity: prefer distinct dominant types, fill remaining slots by volume
  const seenTypes = new Set()
  const selected  = []
  for (const e of locationEntries) {
    if (!seenTypes.has(e.dominantType)) {
      seenTypes.add(e.dominantType)
      selected.push(e)
      if (selected.length >= 3) break
    }
  }
  if (selected.length < 3) {
    const selectedKeys = new Set(selected.map(e => e.key))
    for (const e of locationEntries) {
      if (!selectedKeys.has(e.key)) {
        selected.push(e)
        if (selected.length >= 3) break
      }
    }
  }

  return selected.map(e => {
    const [latStr, lonStr] = e.key.split(',')
    const lon = parseFloat(lonStr)

    // Filter to dominant type only, sorted chronologically
    const allEvents = (chronicSequences[d]?.[e.key] ?? [])
      .filter(ev => ev.typeId === e.dominantType)
      .sort((a, b) => a.date - b.date)

    // Reopen count + return gap intervals (Closed → Open/In Progress transitions)
    let reopenCount = 0
    const returnGapsDays = []
    for (let i = 1; i < allEvents.length; i++) {
      if (allEvents[i-1].status === 'Closed' &&
          (allEvents[i].status === 'Open' || allEvents[i].status === 'In Progress')) {
        reopenCount++
        const prev = allEvents[i-1]
        const closeMs = prev.resolutionDays !== null
          ? prev.date + prev.resolutionDays * 24 * 60 * 60 * 1000
          : prev.date
        const gapDays = (allEvents[i].date - closeMs) / (1000 * 60 * 60 * 24)
        if (gapDays >= 0 && gapDays <= 365 * 3) returnGapsDays.push(gapDays)
      }
    }
    const returnMedianDays = returnGapsDays.length >= 3 ? median(returnGapsDays) : null

    // Timeline events: one (resolved, reported) pair per reopen cycle — keeps array compact
    const timelineEvents = []
    for (let i = 1; i < allEvents.length; i++) {
      if (allEvents[i-1].status === 'Closed' &&
          (allEvents[i].status === 'Open' || allEvents[i].status === 'In Progress')) {
        timelineEvents.push({ date: new Date(allEvents[i-1].date).toISOString().slice(0, 10), eventType: 'resolved' })
        timelineEvents.push({ date: new Date(allEvents[i].date).toISOString().slice(0, 10), eventType: 'reported' })
      }
    }

    // Recent activity: 5 most recent records, newest first
    const recentActivity = allEvents.slice(-5).reverse().map(ev => ({
      date:           new Date(ev.date).toISOString().slice(0, 10),
      status:         ev.status,
      resolutionDays: ev.resolutionDays !== null && ev.resolutionDays !== undefined
        ? +ev.resolutionDays.toFixed(2)
        : null,
    }))

    // maxConsecYears: longest consecutive-year streak
    const years = [...e.yearsSet].sort((a, b) => a - b)
    let maxConsec = 0, curRun = 0, prevY = null
    for (const y of years) {
      curRun = (prevY !== null && y === prevY + 1) ? curRun + 1 : 1
      if (curRun > maxConsec) maxConsec = curRun
      prevY = y
    }

    return {
      count:            e.count,
      _lat:             parseFloat(latStr),
      _lon:             lon,
      location:         `${latStr}°N, ${Math.abs(lon).toFixed(3)}°W`,
      issueType:        TYPE_META[e.dominantType]?.name ?? e.dominantType,
      icon:             TYPE_META[e.dominantType]?.icon ?? '📋',
      iconBg:           TYPE_META[e.dominantType]?.iconBg ?? 'rgba(141,147,158,0.18)',
      since:            e.firstYear,
      reopenCount,
      maxConsecYears:   maxConsec,
      returnMedianDays: returnMedianDays !== null ? +returnMedianDays.toFixed(2) : null,
      timelineEvents,
      recentActivity,
    }
  })
}

// ── Build citywide stats ──────────────────────────────────────────────────────
function buildCitywide() {
  const resolutionByYear = ALL_YEARS.map(y => { const s = yearStats['cw']?.[y]; return s ? rate(s.closed, s.total) : 0 })
  const volumeByYear     = ALL_YEARS.map(y => { const s = yearStats['cw']?.[y]; return s ? Math.round(s.total / 1000) : 0 })
  return { resolutionByYear, volumeByYear }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Loading district boundaries…')
  const geoJson = JSON.parse(fs.readFileSync(GEO_FILE, 'utf8'))
  geoJson.features.sort((a, b) => a.properties.DISTRICTINT - b.properties.DISTRICTINT)
  loadPopulationShares(geoJson.features)
  buildGrid(geoJson.features)

  const files = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv')).sort().map(f => path.join(CSV_DIR, f))
  console.log(`Processing ${files.length} CSV files…`)
  for (const f of files) await processFile(f)

  console.log('Distributing ungeolocated service types…')
  distributeUngeolocated()

  console.log('Detecting auto-close flags…')
  detectAutoCloseFlags()

  console.log('Building district resolution arrays…')
  buildDistResolutionArrays()

  console.log('Building output…')
  const districts = {}
  for (let d = 1; d <= 10; d++) {
    const { sparklineRate, sparklineOpen, sparklineAvgDays } = buildSparklines(d)
    const issueTypes    = buildIssueTypes(d)
    const trendsVsMonth = buildTrendsVsMonth(d)
    const trendsVsYear  = buildTrendsVsYear(d)
    const chronicSpots  = buildChronicSpots(d)

    const monthlyRate = YTD_MONTHS.map(m => {
      const ym = `${CURRENT_YEAR}-${String(m).padStart(2, '0')}`
      const s = distStats[d]?.[ym] ?? { total: 0, closed: 0 }
      return rate(s.closed, s.total)
    })
    const monthlyAvgDays = YTD_MONTHS.map(m => {
      const ym = `${CURRENT_YEAR}-${String(m).padStart(2, '0')}`
      const val = safeMedian(getDistDays(d, [ym]))
      return val !== null ? +val.toFixed(2) : null
    })
    const volumeByYear = ALL_YEARS.map(y => yearStats[d]?.[y]?.total ?? 0)
    const totalReports = ALL_YEARS.reduce((s, y) => s + (yearStats[d]?.[y]?.total ?? 0), 0)

    districts[String(d)] = {
      sparklineRate,
      sparklineOpen,
      sparklineAvgDays,
      monthlyRate,
      monthlyAvgDays,
      volumeByYear,
      totalReports,
      trendsVsMonth,
      trendsVsYear,
      issueTypes,
      byPeriod: {
        month: { summary: buildSummary(d, 'month') },
        year:  { summary: buildSummary(d, 'year')  },
        all:   { summary: buildSummary(d, 'all')   },
      },
      chronicSpots,
    }
  }

  // Reverse-geocode chronic spot coordinates to human-readable street names
  console.log('Geocoding chronic spot locations (Nominatim)…')
  const geoCache = {}
  for (let d = 1; d <= 10; d++) {
    for (const spot of districts[String(d)].chronicSpots) {
      const cacheKey = `${spot._lat.toFixed(3)},${spot._lon.toFixed(3)}`
      if (!(cacheKey in geoCache)) {
        const result  = await reverseGeocode(spot._lat, spot._lon)
        const address = formatAddress(result)
        geoCache[cacheKey] = address
        console.log(`  ${cacheKey} → ${address ?? '(no result)'}`)
        await sleep(1200)
      }
      const resolved = geoCache[cacheKey]
      if (resolved) spot.location = resolved
      delete spot._lat
      delete spot._lon
    }
  }

  const output = {
    meta: {
      generatedAt:  new Date().toISOString(),
      currentMonth: CURRENT_YM,
      currentYear:  CURRENT_YEAR,
    },
    citywide:  buildCitywide(),
    districts,
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(output, null, 2))
  console.log(`Wrote ${OUT_JSON} (${Math.round(fs.statSync(OUT_JSON).size / 1024)}KB)`)

  // TypeScript re-export
  const ts = `// Auto-generated by scripts/buildDashboard311.js — do not edit manually.
// Re-run: node scripts/buildDashboard311.js
import rawData from './dashboard311.json'

export type IssueTypeMetrics = {
  resolvedPct:  number
  avgTimeLabel: string
}

export type RealIssueType = {
  id:                  string
  name:                string
  icon:                string
  iconBg:              string
  coordinateEstimated: boolean
  sparkline:           number[]
  monthlySparkline:    number[]
  peakMonth:           string | null
  firstYear:           number
  countByPeriod:       { month: number; year: number; all: number }
  month:               IssueTypeMetrics
  year:                IssueTypeMetrics
  all:                 IssueTypeMetrics
}

export type SummaryCardData = {
  resolutionRate:      number
  resolutionRateDelta: number
  avgFixTimeLabel:     string
  avgFixTimeDays:      number | null
  avgFixTimeDelta:     number | null
}

export type TrendItem = {
  name: string
  pct:  number
}

export type ChronicSpot = {
  count:            number
  location:         string
  issueType:        string
  icon:             string
  iconBg:           string
  since:            number
  reopenCount:      number
  maxConsecYears:   number
  returnMedianDays: number | null
  timelineEvents:   { date: string; eventType: 'resolved' | 'reported' }[]
  recentActivity:   { date: string; status: string; resolutionDays: number | null }[]
}

type RealDistrictData = {
  sparklineRate:    number[]
  sparklineOpen:    number[]
  sparklineAvgDays: (number | null)[]
  monthlyRate:      number[]
  monthlyAvgDays:   (number | null)[]
  volumeByYear:     number[]
  totalReports:     number
  trendsVsMonth:    TrendItem[]
  trendsVsYear:     TrendItem[]
  issueTypes:       RealIssueType[]
  byPeriod: {
    month: { summary: SummaryCardData }
    year:  { summary: SummaryCardData }
    all:   { summary: SummaryCardData }
  }
  chronicSpots: ChronicSpot[]
}

type Dashboard311 = {
  meta:      { generatedAt: string; currentMonth: string; currentYear: number }
  citywide:  { resolutionByYear: number[]; volumeByYear: number[] }
  districts: Record<string, RealDistrictData>
}

export const dashboard311 = rawData as unknown as Dashboard311
`
  fs.writeFileSync(OUT_TS, ts)
  console.log(`Wrote ${OUT_TS}`)

  // Summary
  const cw = output.citywide
  console.log('\nCitywide resolution by year:')
  ALL_YEARS.forEach((y, i) => console.log(`  ${y}: ${cw.resolutionByYear[i]}%  (${cw.volumeByYear[i]}K reports)`))
  const d3 = districts['3']
  console.log('\nDistrict 3 sparklineRate:    ', d3.sparklineRate)
  console.log('District 3 sparklineAvgDays:', d3.sparklineAvgDays)
  console.log('District 3 trendsVsMonth:   ', d3.trendsVsMonth)
  console.log('District 3 trendsVsYear:    ', d3.trendsVsYear)
  console.log('District 3 chronicSpots:')
  d3.chronicSpots.forEach(s => console.log(`  ${s.location} — ${s.issueType}, since ${s.since}, ${s.maxConsecYears} consec yrs, ${s.reopenCount} reopens`))
  console.log('\nDistrict 3 byPeriod.month.summary:', d3.byPeriod.month.summary)
}

main().catch(err => { console.error(err); process.exit(1) })
