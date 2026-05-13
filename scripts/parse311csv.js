#!/usr/bin/env node
/**
 * Parses SJ 311 CSVs and outputs aggregated dashboard stats to:
 *   mobile/src/data/historic311.json
 *   mobile/src/data/historic311.ts  (typed re-export)
 *
 * Run: node scripts/parse311csv.js
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const CSV_DIR = path.join(__dirname, '../mobile/src/data/SJ311_2017to2025')
const OUT_JSON = path.join(__dirname, '../mobile/src/data/historic311.json')
const OUT_TS = path.join(__dirname, '../mobile/src/data/historic311.ts')

// ── CSV parser ────────────────────────────────────────────────────────────────
// Handles quoted fields with embedded commas/quotes per RFC 4180.
function parseCSVLine(line) {
  const fields = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else cur += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { fields.push(cur); cur = '' }
      else cur += ch
    }
  }
  fields.push(cur)
  return fields
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function parseDate(raw) {
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function toYearMonth(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function daysBetween(a, b) {
  return (b - a) / (1000 * 60 * 60 * 24)
}

// ── Accumulators ──────────────────────────────────────────────────────────────
// byYearMonth[ym] = { reported, resolved, serviceTypeCounts: { [type]: n } }
const byYearMonth = {}
// serviceTypeCounts[type] = total count
const serviceTypeCounts = {}
// resolutionAccum[type] = { totalDays, count }
const resolutionAccum = {}
// byYear[year] = { reported, resolved }
const byYear = {}

function getYM(ym) {
  if (!byYearMonth[ym]) byYearMonth[ym] = { reported: 0, resolved: 0, serviceTypeCounts: {} }
  return byYearMonth[ym]
}

function getYear(y) {
  if (!byYear[y]) byYear[y] = { reported: 0, resolved: 0 }
  return byYear[y]
}

// ── Process a single parsed row ───────────────────────────────────────────────
function processRow(fields) {
  // Columns: Incident_ID, Status, Source, Category, Service Type,
  //          Latitude, Longitude, Date Created, Date Last Updated, Department
  const status = fields[1]?.trim()
  const serviceType = fields[4]?.trim() || 'Unknown'
  const dateCreatedRaw = fields[7]?.trim()
  const dateUpdatedRaw = fields[8]?.trim()

  const created = parseDate(dateCreatedRaw)
  if (!created) return

  const ym = toYearMonth(created)
  const year = String(created.getFullYear())

  const ymBucket = getYM(ym)
  const yearBucket = getYear(year)

  ymBucket.reported++
  yearBucket.reported++

  ymBucket.serviceTypeCounts[serviceType] = (ymBucket.serviceTypeCounts[serviceType] ?? 0) + 1
  serviceTypeCounts[serviceType] = (serviceTypeCounts[serviceType] ?? 0) + 1

  const isResolved = status === 'Closed'
  if (isResolved) {
    ymBucket.resolved++
    yearBucket.resolved++

    const updated = parseDate(dateUpdatedRaw)
    if (updated && updated >= created) {
      const days = daysBetween(created, updated)
      if (!resolutionAccum[serviceType]) resolutionAccum[serviceType] = { totalDays: 0, count: 0 }
      resolutionAccum[serviceType].totalDays += days
      resolutionAccum[serviceType].count++
    }
  }
}

// ── Stream a single CSV file ──────────────────────────────────────────────────
function processFile(filePath) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    })
    let isHeader = true
    let rows = 0
    rl.on('line', (line) => {
      if (isHeader) { isHeader = false; return }
      if (!line.trim()) return
      processRow(parseCSVLine(line))
      rows++
    })
    rl.on('close', () => { console.log(`  ${path.basename(filePath)}: ${rows.toLocaleString()} rows`) ; resolve() })
    rl.on('error', reject)
  })
}

// ── Build final output ────────────────────────────────────────────────────────
function buildOutput() {
  // Top service types overall (top 20)
  const topServiceTypes = Object.entries(serviceTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([serviceType, count]) => ({ serviceType, count }))

  // Average resolution days per service type
  const avgResolutionDays = {}
  for (const [type, { totalDays, count }] of Object.entries(resolutionAccum)) {
    avgResolutionDays[type] = Math.round((totalDays / count) * 10) / 10
  }

  // Per year-month: keep top 5 service types per bucket, drop raw counts map
  const byYearMonthClean = {}
  for (const [ym, bucket] of Object.entries(byYearMonth)) {
    const topTypes = Object.entries(bucket.serviceTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([serviceType, count]) => ({ serviceType, count }))
    byYearMonthClean[ym] = {
      reported: bucket.reported,
      resolved: bucket.resolved,
      topServiceTypes: topTypes,
    }
  }

  return { byYear, byYearMonth: byYearMonthClean, topServiceTypes, avgResolutionDays }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const files = fs.readdirSync(CSV_DIR)
    .filter(f => f.endsWith('.csv'))
    .sort()
    .map(f => path.join(CSV_DIR, f))

  console.log(`Processing ${files.length} files…`)
  for (const f of files) await processFile(f)

  console.log('Building output…')
  const output = buildOutput()

  fs.writeFileSync(OUT_JSON, JSON.stringify(output, null, 2))
  console.log(`Wrote ${OUT_JSON}`)

  const ts = `// Auto-generated by scripts/parse311csv.js — do not edit manually.
import data from './historic311.json'

export type YearMonthStat = {
  reported: number
  resolved: number
  topServiceTypes: { serviceType: string; count: number }[]
}

export type Historic311Data = {
  byYear: Record<string, { reported: number; resolved: number }>
  byYearMonth: Record<string, YearMonthStat>
  topServiceTypes: { serviceType: string; count: number }[]
  avgResolutionDays: Record<string, number>
}

export const historic311 = data as Historic311Data
`
  fs.writeFileSync(OUT_TS, ts)
  console.log(`Wrote ${OUT_TS}`)

  // Quick summary
  const years = Object.keys(output.byYear).sort()
  const total = Object.values(output.byYear).reduce((s, y) => s + y.reported, 0)
  console.log(`\nSummary: ${total.toLocaleString()} reports | years ${years[0]}–${years[years.length - 1]}`)
  console.log('Top 5 service types:')
  output.topServiceTypes.slice(0, 5).forEach(({ serviceType, count }) =>
    console.log(`  ${count.toLocaleString().padStart(8)}  ${serviceType}`)
  )
}

main().catch(err => { console.error(err); process.exit(1) })
