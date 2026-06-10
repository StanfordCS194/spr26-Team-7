#!/usr/bin/env node
/**
 * Diagnostic script: compare V1 vs V2 reopenCount for chronic spots.
 * V1 = adjacent Closed→Open transitions in sorted sequence
 * V2 = incident cycles (30-day grouping; recurrence = new incident after resolved previous)
 *
 * Run: node scripts/auditChronicSpots.js
 * Does NOT write any output files. Read-only audit.
 */

const fs       = require('fs')
const path     = require('path')
const readline = require('readline')

const CSV_DIR  = path.join(__dirname, '../mobile/src/data/SJ311_2017to20260512')
const GEO_FILE = path.join(__dirname, 'sj-council-districts.geojson')
const V1_JSON  = path.join(__dirname, '../mobile/src/data/dashboard311.json')

// ── Constants (same as buildDashboard311.js) ───────────────────────────────────
const LAT_MIN = 37.1, LAT_MAX = 37.5
const LON_MIN = -122.1, LON_MAX = -121.7

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

const TYPE_NAME = {
  junk: 'Junk Pickup', graffiti: 'Graffiti', streetlight: 'Streetlight Outage',
  dumping: 'Illegal Dumping', vehicle: 'Vehicle Concerns', container: 'Container Issues',
  encampment: 'Encampment Concerns', pothole: 'Pothole',
}

const ARTIFACT_COORDS = new Set([
  '37.338,-121.886', '37.321,-121.876', '37.338,-121.885', '37.346,-121.885',
  '37.274,-121.903', '37.279,-121.901', '37.274,-121.904', '37.273,-121.903',
])
function isArtifactCoord(lat, lon) {
  return ARTIFACT_COORDS.has(`${lat.toFixed(3)},${lon.toFixed(3)}`)
}

// ── Spatial grid ───────────────────────────────────────────────────────────────
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
  process.stdout.write('Building spatial grid… ')
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
  console.log('done.')
}

function lookupDistrict(lat, lon) {
  if (lat < LAT_MIN || lat > LAT_MAX || lon < LON_MIN || lon > LON_MAX) return 0
  const li  = Math.min(GRID_NLAT - 1, Math.floor((lat - LAT_MIN) / GRID_STEP))
  const lni = Math.min(GRID_NLON - 1, Math.floor((lon - LON_MIN) / GRID_STEP))
  return districtGrid[li * GRID_NLON + lni]
}

// ── CSV helpers ────────────────────────────────────────────────────────────────
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

// ── Accumulators ───────────────────────────────────────────────────────────────
// chronicMap[d][key][typeId] = { total, years: Set, firstYear }
const chronicMap = {}
// chronicSequences[d][key] = [{date, status, typeId, resolutionDays}]
const chronicSequences = {}

function processRow(fields) {
  const status      = fields[1]?.trim()
  const serviceType = fields[4]?.trim() || ''
  const latStr      = fields[5]?.trim()
  const lonStr      = fields[6]?.trim()
  const createdRaw  = fields[7]?.trim()
  const updatedRaw  = fields[8]?.trim()

  const typeId = TYPE_MAP[serviceType] || null
  if (!typeId) return

  const created = parseDate(createdRaw)
  if (!created) return

  const year     = created.getFullYear()
  const isClosed = status === 'Closed'

  let resDays = null
  if (isClosed) {
    const updated = parseDate(updatedRaw)
    if (updated && updated >= created) {
      const days = (updated - created) / (1000 * 60 * 60 * 24)
      if (days >= 0 && days <= 365) resDays = days
    }
  }

  const lat = parseFloat(latStr)
  const lon = parseFloat(lonStr)
  if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) return

  const district = lookupDistrict(lat, lon)
  if (district === 0) return
  if (isArtifactCoord(lat, lon)) return

  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`
  if (!chronicMap[district])              chronicMap[district] = {}
  if (!chronicMap[district][key])         chronicMap[district][key] = {}
  if (!chronicMap[district][key][typeId]) {
    chronicMap[district][key][typeId] = { total: 0, years: new Set(), firstYear: year }
  }
  const c = chronicMap[district][key][typeId]
  c.total++
  c.years.add(year)
  if (year < c.firstYear) c.firstYear = year

  if (!chronicSequences[district])      chronicSequences[district] = {}
  if (!chronicSequences[district][key]) chronicSequences[district][key] = []
  chronicSequences[district][key].push({ date: created.getTime(), status, typeId, resolutionDays: resDays })
}

function processFile(filePath) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    })
    let isHeader = true
    rl.on('line', line => {
      if (isHeader) { isHeader = false; return }
      if (line.trim()) processRow(parseCSVLine(line))
    })
    rl.on('close', resolve)
    rl.on('error', reject)
  })
}

// ── Spot selection (identical to V1 algorithm) ─────────────────────────────────
function selectTopSpots(d) {
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
    if (dominantType && totalCount >= 15 && totalCount <= 2000) {
      entries.push({ key, dominantType, dominantCount, count: totalCount, firstYear, yearsSet })
    }
  }
  entries.sort((a, b) => b.count - a.count)

  const seenTypes = new Set()
  const selected  = []
  for (const e of entries) {
    if (!seenTypes.has(e.dominantType)) {
      seenTypes.add(e.dominantType)
      selected.push(e)
      if (selected.length >= 3) break
    }
  }
  if (selected.length < 3) {
    const selectedKeys = new Set(selected.map(e => e.key))
    for (const e of entries) {
      if (!selectedKeys.has(e.key)) {
        selected.push(e)
        if (selected.length >= 3) break
      }
    }
  }
  return selected
}

// ── V1: adjacent Closed→Open transitions ──────────────────────────────────────
function computeV1Reopen(events) {
  let count = 0
  for (let i = 1; i < events.length; i++) {
    if (events[i-1].status === 'Closed' &&
        (events[i].status === 'Open' || events[i].status === 'In Progress')) {
      count++
    }
  }
  return count
}

// ── V2: incident cycles (30-day window) ───────────────────────────────────────
const INCIDENT_GAP_MS = 30 * 24 * 60 * 60 * 1000

function computeV2Incidents(events) {
  if (events.length === 0) return { reopenCount: 0, incidentCount: 0, resolvedIncidents: 0, mixedIncidents: 0 }

  // Group consecutive events within 30 days into incidents
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

  // Classify each incident
  let resolvedIncidents = 0, mixedIncidents = 0
  const incidentMeta = incidents.map(inc => {
    const allClosed = inc.every(ev => ev.status === 'Closed')
    const anyClosed = inc.some(ev => ev.status === 'Closed')
    const anyOpen   = inc.some(ev => ev.status !== 'Closed')
    if (allClosed) resolvedIncidents++
    if (anyClosed && anyOpen) mixedIncidents++
    return { allClosed, records: inc.length, closed: inc.filter(e => e.status === 'Closed').length }
  })

  // reopenCount = number of incidents preceded by a fully-resolved incident
  let reopenCount = 0
  for (let i = 1; i < incidentMeta.length; i++) {
    if (incidentMeta[i-1].allClosed) reopenCount++
  }

  return {
    reopenCount,
    incidentCount:     incidents.length,
    resolvedIncidents,
    mixedIncidents,
    unresolvedIncidents: incidents.length - resolvedIncidents - mixedIncidents,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const geoJson = JSON.parse(fs.readFileSync(GEO_FILE, 'utf8'))
  geoJson.features.sort((a, b) => a.properties.DISTRICTINT - b.properties.DISTRICTINT)
  buildGrid(geoJson.features)

  const files = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv')).sort().map(f => path.join(CSV_DIR, f))
  console.log(`Processing ${files.length} CSV files (no output files will be written)…`)
  for (const f of files) {
    process.stdout.write(`  ${path.basename(f)}… `)
    await processFile(f)
    process.stdout.write('done\n')
  }

  const v1Data = JSON.parse(fs.readFileSync(V1_JSON, 'utf8'))

  console.log('\n═══════════════════════════════════════════════════════════════════')
  console.log('  CHRONIC SPOTS AUDIT: V1 vs V2 reopenCount')
  console.log('  V1 = adjacent Closed→Open transitions in chronological sequence')
  console.log('  V2 = recurrences (new incident starting after a fully-resolved previous incident)')
  console.log('  Incident = group of reports within 30 days of each other')
  console.log('═══════════════════════════════════════════════════════════════════\n')

  for (let d = 1; d <= 10; d++) {
    const spots   = selectTopSpots(d)
    const v1Spots = v1Data.districts[String(d)].chronicSpots

    console.log(`── District ${d} ──────────────────────────────────────────────────────`)
    for (let i = 0; i < spots.length; i++) {
      const e      = spots[i]
      const v1Spot = v1Spots[i]
      const label  = v1Spot?.location ?? e.key

      const allEvents = (chronicSequences[d]?.[e.key] ?? [])
        .filter(ev => ev.typeId === e.dominantType)
        .sort((a, b) => a.date - b.date)

      const nClosed = allEvents.filter(ev => ev.status === 'Closed').length
      const nOpen   = allEvents.filter(ev => ev.status !== 'Closed').length
      const v1      = computeV1Reopen(allEvents)
      const v2      = computeV2Incidents(allEvents)
      const pctClosed = allEvents.length > 0 ? Math.round(nClosed / allEvents.length * 100) : 0

      const typeName = TYPE_NAME[e.dominantType] ?? e.dominantType
      console.log(`  ${typeName} @ ${label}`)
      console.log(`    Total at location (all types):  ${e.count}`)
      console.log(`    Dominant type records:          ${allEvents.length}  (closed=${nClosed} [${pctClosed}%], open/in-progress=${nOpen})`)
      console.log(`    Incidents (30-day groups):      ${v2.incidentCount}`)
      console.log(`      resolved (all Closed):        ${v2.resolvedIncidents}`)
      console.log(`      mixed (Closed + Open):        ${v2.mixedIncidents}`)
      console.log(`      unresolved (all Open/IP):     ${v2.unresolvedIncidents}`)
      console.log(`    V1 reopenCount:  ${v1}   (adjacent Closed→Open transitions)`)
      console.log(`    V2 reopenCount:  ${v2.reopenCount}   (new incident after resolved previous)`)
      console.log()
    }
  }

  console.log('Audit complete. No files were written.')
}

main().catch(err => { console.error(err); process.exit(1) })
