#!/usr/bin/env node
/**
 * Builds V2 dashboard data for the Insights tab redesign.
 * Runs alongside buildDashboard311.js — does NOT modify V1 output.
 *
 * Input:  mobile/src/data/SJ311_2017to20260512/*.csv
 *         scripts/sj-council-districts.geojson
 *         mobile/src/data/dashboard311.json  (reuses geocoded spot locations)
 * Output: mobile/src/data/dashboard311v2.json
 *         mobile/src/data/dashboard311v2.ts
 *
 * Run: node scripts/buildDashboard311v2.js
 */

const fs       = require('fs')
const path     = require('path')
const readline = require('readline')
const https    = require('https')

// ── Paths ─────────────────────────────────────────────────────────────────────
const CSV_DIR  = path.join(__dirname, '../mobile/src/data/SJ311_2017to20260512')
const GEO_FILE = path.join(__dirname, 'sj-council-districts.geojson')
const V1_JSON  = path.join(__dirname, '../mobile/src/data/dashboard311.json')
const OUT_JSON = path.join(__dirname, '../mobile/src/data/dashboard311v2.json')
const OUT_TS   = path.join(__dirname, '../mobile/src/data/dashboard311v2.ts')

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

const UNGEOLOCATED_TYPES = new Set(['junk', 'container'])

// ── SJ bounding box ───────────────────────────────────────────────────────────
const LAT_MIN = 37.1, LAT_MAX = 37.5
const LON_MIN = -122.1, LON_MAX = -121.7

// ── Artifact coordinates (filtered from chronic spots only) ───────────────────
const ARTIFACT_COORDS = new Set([
  '37.338,-121.886', '37.321,-121.876', '37.338,-121.885', '37.346,-121.885',
  '37.274,-121.903', '37.279,-121.901', '37.274,-121.904', '37.273,-121.903',
])
function isArtifactCoord(lat, lon) {
  return ARTIFACT_COORDS.has(`${lat.toFixed(3)},${lon.toFixed(3)}`)
}

// ── Spatial grid (0.005° cells) ───────────────────────────────────────────────
const GRID_STEP = 0.005
const GRID_NLAT = Math.ceil((LAT_MAX - LAT_MIN) / GRID_STEP)
const GRID_NLON = Math.ceil((LON_MAX - LON_MIN) / GRID_STEP)
const districtGrid = new Uint8Array(GRID_NLAT * GRID_NLON)

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

// ── CSV helpers ───────────────────────────────────────────────────────────────
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

// ── Data quality threshold ────────────────────────────────────────────────────
const MIN_CLOSED_FOR_AVG = 50

// ── Count accumulators ────────────────────────────────────────────────────────
const distStats     = {}  // [d][ym]            = { total, closed, open }
const yearStats     = {}  // [d][year]          = { total, closed, open }
const typeStats     = {}  // [d][ym][t]         = { total, closed }
const typeYearStats = {}  // [d][year][t]       = { total, closed }

// ── Resolution day arrays ─────────────────────────────────────────────────────
const resolveDaysDistYM   = {}  // [d][ym]            = number[]
const resolveDaysDistYear = {}  // [d][year]          = number[]
const resolveDaysTypeYM   = {}  // [d or 'cw'][ym][t] = number[]

// ── Auto-close flags ──────────────────────────────────────────────────────────
let autoCloseFlags = new Set()

// ── Chronic spot accumulators ─────────────────────────────────────────────────
const chronicMap       = {}  // [d][key][typeId] = { total, years: Set, firstYear }
const chronicSequences = {}  // [d][key]         = [{date, status, typeId, resolutionDays}]

// ── Accessor helpers ──────────────────────────────────────────────────────────
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

  const year     = created.getFullYear()
  const ym       = ymKey(created)
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

  // Citywide
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
  }

  // District
  const lat = parseFloat(latStr)
  const lon = parseFloat(lonStr)
  const hasCoords = !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0
  const district  = hasCoords ? lookupDistrict(lat, lon) : 0
  if (district === 0) return

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

    // Chronic spot tracking — skip artifact coordinates
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

// ── Distribute ungeolocated types by population share ─────────────────────────
function distributeUngeolocated() {
  const allYMs = Object.keys(distStats['cw'] ?? {}).sort()
  const allYrs = Object.keys(yearStats['cw'] ?? {}).map(Number).sort()
  for (const t of TYPE_IDS) {
    let geoTotal = 0
    for (let d = 1; d <= 10; d++)
      for (const ym of allYMs)
        geoTotal += typeStats[d]?.[ym]?.[t]?.total ?? 0
    const cwTotal = allYMs.reduce((s, ym) => s + (typeStats['cw']?.[ym]?.[t]?.total ?? 0), 0)
    if (cwTotal === 0 || geoTotal / cwTotal > 0.10) continue
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
      for (const y of allYrs) {
        const cwy = typeYearStats['cw']?.[y]?.[t]
        if (!cwy || cwy.total === 0) continue
        const s = getTYS(d, y, t)
        s.total  += Math.round(cwy.total  * share)
        s.closed += Math.round(cwy.closed * share)
      }
    }
  }
}

// ── Auto-close detection ──────────────────────────────────────────────────────
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
}

// ── Build district resolution arrays (aggregate from per-type, exclude auto-close) ──
function buildDistResolutionArrays() {
  const allYMs = Object.keys(distStats['cw'] ?? {}).sort()
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

// ── Stat helpers ──────────────────────────────────────────────────────────────
function median(arr) {
  if (!arr || arr.length === 0) return null
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid-1] + sorted[mid]) / 2 : sorted[mid]
}

function safeMedian(arr) {
  return (!arr || arr.length < MIN_CLOSED_FOR_AVG) ? null : median(arr)
}

function rate(closed, total) {
  return total > 0 ? Math.round((closed / total) * 100) : 0
}

function ymList(year, months) {
  return months.map(m => `${year}-${String(m).padStart(2, '0')}`)
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

function getDistDays(d, yms) {
  const arr = []
  for (const ym of yms) {
    const src = resolveDaysDistYM[d]?.[ym]
    if (src) arr.push(...src)
  }
  return arr
}

// Ungeolocated types fall back to citywide; auto-close months excluded
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

// ── Dynamic period detection ──────────────────────────────────────────────────
function detectPeriods() {
  // Only consider months with >= 500 citywide records to exclude data edges
  const qualifyingYMs = Object.keys(distStats['cw'] ?? {})
    .filter(ym => (distStats['cw'][ym]?.total ?? 0) >= 500)
    .sort()

  if (qualifyingYMs.length === 0) throw new Error('No month with ≥ 500 citywide records found in data')

  const volumes    = qualifyingYMs.map(ym => distStats['cw'][ym].total)
  const avgMonthly = volumes.reduce((a, b) => a + b, 0) / volumes.length

  const candidateYM  = qualifyingYMs[qualifyingYMs.length - 1]
  const candidateVol = distStats['cw'][candidateYM].total
  const pctOfAvg     = candidateVol / avgMonthly

  let currentYM, isPartialMonth

  if (pctOfAvg < 0.50) {
    // Too sparse — fall back to previous qualifying month (almost certainly a full month)
    const fallbackYM = qualifyingYMs[qualifyingYMs.length - 2]
    if (!fallbackYM) throw new Error('Insufficient data history for period detection')
    console.log(`  ${candidateYM} is ${Math.round(pctOfAvg*100)}% of average (< 50%) → falling back to ${fallbackYM}`)
    currentYM      = fallbackYM
    isPartialMonth = false
  } else if (pctOfAvg < 0.80) {
    currentYM      = candidateYM
    isPartialMonth = true
    console.log(`  Current month: ${currentYM} (${Math.round(pctOfAvg*100)}% of average — marked partial)`)
  } else {
    currentYM      = candidateYM
    isPartialMonth = false
    console.log(`  Current month: ${currentYM} (${Math.round(pctOfAvg*100)}% of average)`)
  }

  const [cy, cm] = currentYM.split('-').map(Number)
  const pm        = cm === 1 ? 12    : cm - 1
  const py        = cm === 1 ? cy-1  : cy
  const priorYM   = `${py}-${String(pm).padStart(2, '0')}`
  const ytdMonths = Array.from({ length: cm }, (_, i) => i + 1)

  return { currentYM, priorYM, currentYear: cy, ytdMonths, isPartialMonth, avgMonthlyVolume: Math.round(avgMonthly) }
}

// ── V2 builders ───────────────────────────────────────────────────────────────

function buildCategoryComparison(d, yms) {
  const items = []
  for (const typeId of TYPE_IDS) {
    const stats = sumTypeYM(d, yms, typeId)
    if (stats.total === 0) continue
    const daysArr = getTypeDays(d, yms, typeId)
    const med     = daysArr.length >= MIN_CLOSED_FOR_AVG ? median(daysArr) : null
    items.push({
      type:           TYPE_META[typeId].name,
      fixTimeHours:   med !== null ? +(med * 24).toFixed(1) : null,
      resolutionRate: rate(stats.closed, stats.total),
      volume:         stats.total,
    })
  }
  return items.sort((a, b) => b.volume - a.volume)
}

function buildTopIssues(d, currentYM) {
  const items = []
  for (const typeId of TYPE_IDS) {
    const count = typeStats[d]?.[currentYM]?.[typeId]?.total ?? 0
    if (count === 0) continue
    items.push({ type: TYPE_META[typeId].name, count, icon: TYPE_META[typeId].icon })
  }
  return items.sort((a, b) => b.count - a.count).slice(0, 5)
}

function buildTrendLines(d, currentYM, allYears) {
  // Last 12 months ending at currentYM (inclusive)
  const [cy, cm] = currentYM.split('-').map(Number)
  const last12 = []
  for (let i = 11; i >= 0; i--) {
    let m = cm - i, y = cy
    while (m <= 0) { m += 12; y-- }
    last12.push(`${y}-${String(m).padStart(2, '0')}`)
  }

  const result = {}
  for (const typeId of TYPE_IDS) {
    result[TYPE_META[typeId].name] = {
      monthly: last12.map(ym => ({
        period: ym,
        count:  typeStats[d]?.[ym]?.[typeId]?.total ?? 0,
      })),
      yearly: allYears.map(y => ({
        period: String(y),
        count:  typeYearStats[d]?.[y]?.[typeId]?.total ?? 0,
      })),
    }
  }
  return result
}

function buildDistrictMetrics(d, yms) {
  const stats = sumDistYM(d, yms)
  const days  = getDistDays(d, yms)
  const med   = safeMedian(days)
  return {
    resolutionRate:  rate(stats.closed, stats.total),
    avgFixTimeHours: med !== null ? +(med * 24).toFixed(1) : null,
    totalReports:    stats.total,
  }
}

// City average: resolutionRate + totalReports from cw (correct citywide counts),
// avgFixTimeHours pooled from all 10 districts (excludes ungeolocated types,
// same as per-district — ensures apples-to-apples comparison)
function buildCityAverageMetrics(yms) {
  const pooledDays = []
  for (let d = 1; d <= 10; d++) pooledDays.push(...getDistDays(d, yms))
  const med     = safeMedian(pooledDays)
  const cwStats = sumDistYM('cw', yms)
  return {
    resolutionRate:  rate(cwStats.closed, cwStats.total),
    avgFixTimeHours: med !== null ? +(med * 24).toFixed(1) : null,
    totalReports:    cwStats.total,
  }
}

function buildDistrictComparison(periods) {
  const { currentYM, currentYear, ytdMonths } = periods
  const ytdYMs = ymList(currentYear, ytdMonths)
  const month = {}, year = {}
  for (let d = 1; d <= 10; d++) {
    month[String(d)] = buildDistrictMetrics(d, [currentYM])
    year[String(d)]  = buildDistrictMetrics(d, ytdYMs)
  }
  return {
    month,
    year,
    cityAverage: {
      month: buildCityAverageMetrics([currentYM]),
      year:  buildCityAverageMetrics(ytdYMs),
    },
  }
}

// ── Geocoding helpers ─────────────────────────────────────────────────────────
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

// ── V2 recurring issues: incident-cycle algorithm ─────────────────────────────
const INCIDENT_GAP_MS = 30 * 24 * 60 * 60 * 1000

function groupIntoIncidents(events) {
  if (events.length === 0) return []
  const incidents = []
  let current = [events[0]]
  for (let i = 1; i < events.length; i++) {
    if (events[i].date - events[i-1].date <= INCIDENT_GAP_MS) {
      current.push(events[i])
    } else {
      incidents.push(current)
      current = [events[i]]
    }
  }
  incidents.push(current)
  return incidents
}

function buildRecurringIssues(d, v1Spots) {
  const map = chronicMap[d] ?? {}
  const entries = []

  for (const [key, types] of Object.entries(map)) {
    let dominantType = null, dominantCount = 0, totalCount = 0, firstYear = Infinity
    const yearsSet = new Set()
    for (const [typeId, data] of Object.entries(types)) {
      totalCount += data.total
      if (data.total > dominantCount) { dominantCount = data.total; dominantType = typeId }
      if (data.firstYear < firstYear) firstYear = data.firstYear
      for (const y of data.years) yearsSet.add(y)
    }
    if (dominantType && totalCount >= 15 && totalCount <= 2000)
      entries.push({ key, dominantType, dominantCount, count: totalCount, firstYear, yearsSet })
  }
  entries.sort((a, b) => b.count - a.count)

  // Top 10 by volume — UI handles grouping by type
  const selected = entries.slice(0, 10)

  return selected.map((e, spotIdx) => {
    const [latStr, lonStr] = e.key.split(',')
    const lat = parseFloat(latStr)
    const lon = parseFloat(lonStr)

    const allEvents = (chronicSequences[d]?.[e.key] ?? [])
      .filter(ev => ev.typeId === e.dominantType)
      .sort((a, b) => a.date - b.date)

    const incidents = groupIntoIncidents(allEvents)

    // Per-incident: is it fully resolved, and when did the last closure happen?
    const incidentMeta = incidents.map(inc => {
      const allClosed = inc.every(ev => ev.status === 'Closed')
      let lastClosureMs = null
      if (allClosed) {
        for (const ev of inc) {
          const closeMs = ev.resolutionDays !== null
            ? ev.date + ev.resolutionDays * 24 * 60 * 60 * 1000
            : ev.date
          if (lastClosureMs === null || closeMs > lastClosureMs) lastClosureMs = closeMs
        }
      }
      return { allClosed, firstDate: inc[0].date, lastClosureMs }
    })

    let reopenCount = 0
    const returnGapsDays = []
    const timelineEvents = []

    for (let j = 1; j < incidentMeta.length; j++) {
      const prev = incidentMeta[j-1]
      if (!prev.allClosed) continue
      reopenCount++
      if (prev.lastClosureMs !== null) {
        const gapDays = (incidentMeta[j].firstDate - prev.lastClosureMs) / (1000 * 60 * 60 * 24)
        if (gapDays >= 0 && gapDays <= 365 * 3) returnGapsDays.push(gapDays)
      }
      // Compact (resolved, reported) pair per recurrence
      const resolvedDate = prev.lastClosureMs !== null
        ? new Date(prev.lastClosureMs).toISOString().slice(0, 10)
        : new Date(incidents[j-1][incidents[j-1].length - 1].date).toISOString().slice(0, 10)
      timelineEvents.push({ date: resolvedDate,                                                  eventType: 'resolved' })
      timelineEvents.push({ date: new Date(incidentMeta[j].firstDate).toISOString().slice(0, 10), eventType: 'reported' })
    }

    const returnMedianDays = returnGapsDays.length >= 3
      ? +(median(returnGapsDays)).toFixed(2)
      : null

    // maxConsecYears
    const years = [...e.yearsSet].sort((a, b) => a - b)
    let maxConsec = 0, curRun = 0, prevY = null
    for (const y of years) {
      curRun = (prevY !== null && y === prevY + 1) ? curRun + 1 : 1
      if (curRun > maxConsec) maxConsec = curRun
      prevY = y
    }

    const recentActivity = allEvents.slice(-5).reverse().map(ev => ({
      date:           new Date(ev.date).toISOString().slice(0, 10),
      status:         ev.status,
      resolutionDays: ev.resolutionDays !== null ? +ev.resolutionDays.toFixed(2) : null,
    }))

    // Reuse V1 geocoded address by positional index (same selection algorithm → same spots)
    const v1Location = v1Spots[spotIdx]?.location
    const location = v1Location ?? `${latStr}°N, ${Math.abs(lon).toFixed(3)}°W`

    const spotObj = {
      count:            e.count,
      location,
      issueType:        TYPE_META[e.dominantType]?.name ?? e.dominantType,
      icon:             TYPE_META[e.dominantType]?.icon  ?? '📋',
      iconBg:           TYPE_META[e.dominantType]?.iconBg ?? 'rgba(141,147,158,0.18)',
      since:            e.firstYear,
      reopenCount,
      incidentCount:    incidents.length,
      maxConsecYears:   maxConsec,
      returnMedianDays,
      timelineEvents,
      recentActivity,
    }
    if (!v1Location) { spotObj._lat = lat; spotObj._lon = lon }
    return spotObj
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Loading district boundaries…')
  const geoJson = JSON.parse(fs.readFileSync(GEO_FILE, 'utf8'))
  geoJson.features.sort((a, b) => a.properties.DISTRICTINT - b.properties.DISTRICTINT)
  loadPopulationShares(geoJson.features)
  buildGrid(geoJson.features)

  const v1Data = JSON.parse(fs.readFileSync(V1_JSON, 'utf8'))

  const files = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv')).sort().map(f => path.join(CSV_DIR, f))
  console.log(`Processing ${files.length} CSV files…`)
  for (const f of files) await processFile(f)

  console.log('Distributing ungeolocated service types…')
  distributeUngeolocated()

  console.log('Detecting auto-close flags…')
  detectAutoCloseFlags()

  console.log('Building district resolution arrays…')
  buildDistResolutionArrays()

  console.log('Detecting current period from data…')
  const periods = detectPeriods()
  const { currentYM, priorYM, currentYear, ytdMonths, isPartialMonth, avgMonthlyVolume } = periods
  const ytdYMs = ymList(currentYear, ytdMonths)

  // All years that have citywide data (derived from accumulator, not hardcoded)
  const allYears = Object.keys(yearStats['cw'] ?? {})
    .map(Number).sort()
    .filter(y => (yearStats['cw'][y]?.total ?? 0) > 0)

  console.log('Building V2 structures…')
  const districts = {}
  for (let d = 1; d <= 10; d++) {
    const v1Spots = v1Data.districts[String(d)]?.chronicSpots ?? []
    districts[String(d)] = {
      categoryComparison: {
        month: buildCategoryComparison(d, [currentYM]),
        year:  buildCategoryComparison(d, ytdYMs),
      },
      topIssues:       buildTopIssues(d, currentYM),
      trendLines:      buildTrendLines(d, currentYM, allYears),
      recurringIssues: buildRecurringIssues(d, v1Spots),
    }
    process.stdout.write(`  District ${d} done\n`)
  }

  const districtComparison = buildDistrictComparison(periods)

  // ── Geocode spots that have no V1 address ─────────────────────────────────
  const geoCache = {}
  let geocodeCount = 0
  for (const dKey of Object.keys(districts)) {
    for (const spot of districts[dKey].recurringIssues) {
      if (spot._lat == null) continue
      const cacheKey = `${spot._lat.toFixed(4)},${spot._lon.toFixed(4)}`
      if (!geoCache[cacheKey]) {
        if (geocodeCount > 0) await sleep(1200)
        process.stdout.write(`  Geocoding ${cacheKey}…`)
        const result = await reverseGeocode(spot._lat, spot._lon)
        geoCache[cacheKey] = formatAddress(result) ?? null
        process.stdout.write(` ${geoCache[cacheKey] ?? 'no result'}\n`)
        geocodeCount++
      }
      if (geoCache[cacheKey]) spot.location = geoCache[cacheKey]
      delete spot._lat
      delete spot._lon
    }
  }
  if (geocodeCount > 0) console.log(`Geocoded ${geocodeCount} spots.`)

  const output = {
    meta: {
      generatedAt:      new Date().toISOString(),
      currentMonth:     currentYM,
      currentYear,
      isPartialMonth,
      priorMonth:       priorYM,
      ytdMonths,
      avgMonthlyVolume,
    },
    districts,
    districtComparison,
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(output, null, 2))
  console.log(`\nWrote ${OUT_JSON} (${Math.round(fs.statSync(OUT_JSON).size / 1024)}KB)`)

  // ── TypeScript module ─────────────────────────────────────────────────────
  const ts = `// Auto-generated by scripts/buildDashboard311v2.js — do not edit manually.
// Re-run: node scripts/buildDashboard311v2.js
import rawData from './dashboard311v2.json'

export type CategoryComparisonItem = {
  type:           string
  fixTimeHours:   number | null
  resolutionRate: number
  volume:         number
}

export type TopIssueItem = {
  type:  string
  count: number
  icon:  string
}

export type TrendPoint = {
  period: string
  count:  number
}

export type TrendLines = {
  [typeName: string]: {
    monthly: TrendPoint[]
    yearly:  TrendPoint[]
  }
}

export type DistrictMetrics = {
  resolutionRate:  number
  avgFixTimeHours: number | null
  totalReports:    number
}

export type ChronicSpotV2 = {
  count:            number
  location:         string
  issueType:        string
  icon:             string
  iconBg:           string
  since:            number
  reopenCount:      number
  incidentCount:    number
  maxConsecYears:   number
  returnMedianDays: number | null
  timelineEvents:   { date: string; eventType: 'resolved' | 'reported' }[]
  recentActivity:   { date: string; status: string; resolutionDays: number | null }[]
}

type DistrictV2Data = {
  categoryComparison: {
    month: CategoryComparisonItem[]
    year:  CategoryComparisonItem[]
  }
  topIssues:       TopIssueItem[]
  trendLines:      TrendLines
  recurringIssues: ChronicSpotV2[]
}

type DashboardV2 = {
  meta: {
    generatedAt:      string
    currentMonth:     string
    currentYear:      number
    isPartialMonth:   boolean
    priorMonth:       string
    ytdMonths:        number[]
    avgMonthlyVolume: number
  }
  districts: Record<string, DistrictV2Data>
  districtComparison: {
    month:       Record<string, DistrictMetrics>
    year:        Record<string, DistrictMetrics>
    cityAverage: { month: DistrictMetrics; year: DistrictMetrics }
  }
}

export const dashboardV2 = rawData as unknown as DashboardV2

export const districtNames: Record<string, string> = {
  "1":  "W. San Jose / Meridian",
  "2":  "Evergreen / E. Foothills",
  "3":  "Downtown / Little Portugal",
  "4":  "Berryessa / N. Valley",
  "5":  "Alum Rock / East Side",
  "6":  "Willow Glen / Rose Garden",
  "7":  "East San Jose / Tully",
  "8":  "Silver Creek / Evergreen",
  "9":  "Blossom Hill / Edenvale",
  "10": "Almaden Valley / S. San Jose",
}
`
  fs.writeFileSync(OUT_TS, ts)
  console.log(`Wrote ${OUT_TS}`)

  // ── Verification summary ──────────────────────────────────────────────────
  console.log(`\nPeriod: currentMonth=${currentYM}  priorMonth=${priorYM}  ytd=[${ytdMonths.join(',')}]  partial=${isPartialMonth}`)
  console.log(`Years in data: ${allYears.join(', ')}`)

  const d3 = output.districts['3']
  console.log('\n── D3 categoryComparison.month (by volume):')
  d3.categoryComparison.month.forEach(c =>
    console.log(`  ${c.type.padEnd(24)} vol=${String(c.volume).padStart(5)}  rate=${c.resolutionRate}%  hours=${c.fixTimeHours ?? 'null'}`)
  )
  console.log('\n── D3 topIssues (current month):')
  d3.topIssues.forEach(t => console.log(`  ${t.icon} ${t.type}: ${t.count.toLocaleString()}`))
  console.log('\n── D3 recurringIssues (V2 incident cycles):')
  d3.recurringIssues.forEach(s =>
    console.log(`  ${s.issueType} @ ${s.location}\n    count=${s.count}  incidents=${s.incidentCount}  reopens=${s.reopenCount}  returnMedianDays=${s.returnMedianDays}`)
  )
  console.log('\n── District comparison — month:')
  for (let d = 1; d <= 10; d++) {
    const m = output.districtComparison.month[String(d)]
    console.log(`  D${d}: rate=${m.resolutionRate}%  hrs=${m.avgFixTimeHours}  reports=${m.totalReports.toLocaleString()}`)
  }
  const ca = output.districtComparison.cityAverage
  console.log(`  City avg (month): rate=${ca.month.resolutionRate}%  hrs=${ca.month.avgFixTimeHours}  reports=${ca.month.totalReports.toLocaleString()}`)
  console.log(`  City avg (year):  rate=${ca.year.resolutionRate}%   hrs=${ca.year.avgFixTimeHours}   reports=${ca.year.totalReports.toLocaleString()}`)
}

main().catch(err => { console.error(err); process.exit(1) })
