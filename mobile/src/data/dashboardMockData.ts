// Mock data layer for DashboardScreen.
// All district-scoped data is in DISTRICTS[1..10].
// CITYWIDE is always shown regardless of district or period selection.
// To wire up real data: replace DISTRICTS and CITYWIDE with API calls.

// ─── Types ────────────────────────────────────────────────────────────────────

export type Period      = 'month' | 'year' | 'all'
export type TrendWindow = 'month' | 'year'

export type IssueTypeDatum = {
  id:           string
  name:         string
  icon:         string
  iconBg:       string          // rgba background for icon box (category color, low opacity)
  countByPeriod: Record<Period, number>
  resolvedPct:  number
  avgTimeLabel: string
  vsMonth:      number          // vs prior month — positive = more reports (concerning)
  vsYear:       number          // vs prior year  — positive = more reports (concerning)
  vs2017:       number          // long-term metric change — positive = worse, negative = improved
  peakMonth:    string | null   // e.g. 'Jul' — seasonal peak, null if no clear pattern
  sparkline:    number[]        // 10 data points, one per year 2017–2026
}

export type SummaryData = {
  resolutionRate:      number
  resolutionRateDelta: number  // positive = improvement
  openIssues:          number
  openIssuesDelta:     number  // positive = more open issues (concerning)
}

export type ChronicSpot = {
  count:            number
  location:         string
  issueType:        string
  since:            number  // year first reported
  reopenCount:      number
  consecutiveYears: number  // show "Reported every year since X" badge if >= 8
}

export type TrendItem = {
  name:    string
  vsMonth: number  // positive = more reports
  vsYear:  number
}

export type PeriodData = {
  summary: SummaryData
  trends:  TrendItem[]
}

export type DistrictData = {
  sparklineRate: number[]    // 10 pts, district resolution rate 2017–2026
  sparklineOpen: number[]    // 10 pts, district open issue count 2017–2026
  issueTypes:    IssueTypeDatum[]
  byPeriod:      Record<Period, PeriodData>
  chronicSpots:  ChronicSpot[]
}

// ─── Citywide (never changes with district or period selection) ───────────────

export const CITYWIDE = {
  // % of issues resolved, per year 2017–2026
  resolutionByYear: [96, 98, 97, 90, 92, 94, 93, 89, 86, 86] as number[],
  // Total citywide reports (thousands), per year 2017–2026
  volumeByYear: [89, 164, 189, 185, 250, 270, 282, 321, 341, 124] as number[],
}

// ─── District neighborhoods ───────────────────────────────────────────────────

export const DISTRICT_NEIGHBORHOODS: Record<number, string> = {
  1:  'Almaden · Cambrian',
  2:  'Willow Glen · Rose Garden',
  3:  'Downtown · SoFA',
  4:  'Alum Rock · East SJ',
  5:  'Berryessa · North Valley',
  6:  'Midtown · Naglee Park',
  7:  'Evergreen · Silver Creek',
  8:  'Edenvale · South SJ',
  9:  'West SJ · Santana Row',
  10: 'Alviso · North SJ',
}

// ─── Icon box backgrounds (category color, dark-theme safe) ──────────────────

const BG = {
  sanitation: 'rgba(240,160,48,0.18)',
  parks:      'rgba(62,207,130,0.18)',
  roads:      'rgba(232,81,74,0.18)',
  utilities:  'rgba(91,155,248,0.18)',
  social:     'rgba(167,139,250,0.18)',
}

// ─── District 3 base data (April 2026 monthly values per spec) ───────────────

const D3_ISSUE_TYPES: IssueTypeDatum[] = [
  {
    id: 'junk',
    name: 'Junk Pickup',
    icon: '🗑️',
    iconBg: BG.sanitation,
    countByPeriod: { month: 7184, year: 25441, all: 420000 },
    resolvedPct: 76, avgTimeLabel: '13 days',
    vsMonth: -10, vsYear: 3, vs2017: -22, peakMonth: 'Jul',
    sparkline: [1800, 2200, 2600, 3000, 4100, 5000, 5700, 6400, 7000, 7184],
  },
  {
    id: 'graffiti',
    name: 'Graffiti',
    icon: '🎨',
    iconBg: BG.parks,
    countByPeriod: { month: 3192, year: 11201, all: 280000 },
    resolvedPct: 89, avgTimeLabel: '2 hours',
    vsMonth: 4, vsYear: -8, vs2017: -35, peakMonth: 'May',
    sparkline: [4200, 4400, 4300, 4000, 3800, 3600, 3400, 3200, 3150, 3192],
  },
  {
    id: 'streetlight',
    name: 'Streetlight Outage',
    icon: '💡',
    iconBg: BG.utilities,
    countByPeriod: { month: 512, year: 1794, all: 42000 },
    resolvedPct: 65, avgTimeLabel: '12 days',
    vsMonth: -18, vsYear: 15, vs2017: 140, peakMonth: 'Jan',
    sparkline: [310, 330, 350, 340, 380, 410, 450, 490, 500, 512],
  },
  {
    id: 'dumping',
    name: 'Illegal Dumping',
    icon: '🚯',
    iconBg: BG.sanitation,
    countByPeriod: { month: 2744, year: 9648, all: 190000 },
    resolvedPct: 96, avgTimeLabel: '<1 day',
    vsMonth: 6, vsYear: 10, vs2017: 83, peakMonth: 'Jul',
    sparkline: [1500, 1700, 1900, 1800, 2000, 2100, 2300, 2500, 2700, 2744],
  },
  {
    id: 'vehicle',
    name: 'Vehicle Concerns',
    icon: '🚗',
    iconBg: BG.roads,
    countByPeriod: { month: 2957, year: 10378, all: 340000 },
    resolvedPct: 97, avgTimeLabel: '<1 day',
    vsMonth: -15, vsYear: -12, vs2017: -38, peakMonth: null,
    sparkline: [4800, 4400, 4100, 3900, 3600, 3400, 3100, 2980, 2950, 2957],
  },
  {
    id: 'container',
    name: 'Container Issues',
    icon: '📦',
    iconBg: BG.sanitation,
    countByPeriod: { month: 1691, year: 5942, all: 98000 },
    resolvedPct: 37, avgTimeLabel: '7 days',
    vsMonth: 7, vsYear: 12, vs2017: 160, peakMonth: null,
    sparkline: [650, 750, 900, 1100, 1250, 1380, 1500, 1620, 1680, 1691],
  },
  {
    id: 'encampment',
    name: 'Encampment Concerns',
    icon: '⛺',
    iconBg: BG.social,
    countByPeriod: { month: 447, year: 1569, all: 38000 },
    resolvedPct: 84, avgTimeLabel: '4 days',
    vsMonth: 7, vsYear: 18, vs2017: 459, peakMonth: null,
    sparkline: [80, 120, 170, 240, 320, 380, 420, 440, 445, 447],
  },
  {
    id: 'pothole',
    name: 'Pothole',
    icon: '🛣️',
    iconBg: BG.roads,
    countByPeriod: { month: 213, year: 748, all: 31000 },
    resolvedPct: 93, avgTimeLabel: '15 hours',
    vsMonth: 18, vsYear: -5, vs2017: -39, peakMonth: 'Mar',
    sparkline: [350, 380, 360, 400, 340, 280, 250, 220, 210, 213],
  },
]

const D3_CHRONIC: ChronicSpot[] = [
  { count: 312, location: '4th & Santa Clara',       issueType: 'Illegal Dumping',  since: 2019, reopenCount: 8,  consecutiveYears: 8  },
  { count: 187, location: 'Keyes St & 26th St',      issueType: 'Graffiti',         since: 2020, reopenCount: 5,  consecutiveYears: 6  },
  { count: 143, location: 'Tully Rd & Capitol Expy', issueType: 'Vehicle Concerns', since: 2018, reopenCount: 11, consecutiveYears: 8  },
]

const D3_TRENDS: TrendItem[] = [
  { name: 'Pothole Reports',     vsMonth:  18, vsYear:  -5 },
  { name: 'Encampment Concerns', vsMonth:   7, vsYear:  18 },
  { name: 'Container Issues',    vsMonth:   7, vsYear:  12 },
  { name: 'Vehicle Concerns',    vsMonth: -15, vsYear: -12 },
  { name: 'Streetlight Outage',  vsMonth: -18, vsYear:  15 },
]

// ─── District data factory ────────────────────────────────────────────────────

const DISTRICT_SCALE: Record<number, { count: number; rateAdj: number; openOffset: number }> = {
  1:  { count: 0.70, rateAdj:  2, openOffset: -20 },
  2:  { count: 0.80, rateAdj:  1, openOffset: -10 },
  3:  { count: 1.00, rateAdj:  0, openOffset:   0 },
  4:  { count: 1.40, rateAdj: -5, openOffset:  45 },
  5:  { count: 0.60, rateAdj:  3, openOffset: -30 },
  6:  { count: 0.90, rateAdj:  0, openOffset:  -5 },
  7:  { count: 0.65, rateAdj:  4, openOffset: -35 },
  8:  { count: 0.75, rateAdj:  2, openOffset: -15 },
  9:  { count: 0.85, rateAdj:  1, openOffset:  -8 },
  10: { count: 0.55, rateAdj:  5, openOffset: -40 },
}

function buildDistrictData(district: number): DistrictData {
  const { count: c, rateAdj, openOffset } = DISTRICT_SCALE[district] ?? DISTRICT_SCALE[3]
  const baseRate = Math.min(99, Math.max(30, 78 + rateAdj))
  const baseOpen = Math.max(10, 142 + openOffset)

  const issueTypes: IssueTypeDatum[] = D3_ISSUE_TYPES.map(item => ({
    ...item,
    countByPeriod: {
      month: Math.round(item.countByPeriod.month * c),
      year:  Math.round(item.countByPeriod.year * c),
      all:   Math.round(item.countByPeriod.all * c),
    },
    resolvedPct: Math.min(99, Math.max(20, item.resolvedPct + rateAdj)),
    sparkline: item.sparkline.map(v => Math.round(v * c)),
  }))

  return {
    sparklineRate: [82, 84, 84, 80, 81, 82, 80, 79, 78, baseRate],
    sparklineOpen: [95, 100, 110, 115, 120, 130, 138, 140, 142, baseOpen],
    issueTypes,
    byPeriod: {
      month: {
        summary: { resolutionRate: baseRate, resolutionRateDelta: 3, openIssues: baseOpen, openIssuesDelta: 12 },
        trends: D3_TRENDS,
      },
      year: {
        summary: { resolutionRate: Math.max(30, baseRate - 2), resolutionRateDelta: -2, openIssues: Math.round(baseOpen * 10.5), openIssuesDelta: Math.round(baseOpen * 0.8) },
        trends: D3_TRENDS,
      },
      all: {
        summary: { resolutionRate: Math.max(30, baseRate - 5), resolutionRateDelta: 15, openIssues: Math.round(baseOpen * 85), openIssuesDelta: -890 },
        trends: D3_TRENDS,
      },
    },
    chronicSpots: D3_CHRONIC.map(spot => ({ ...spot, count: Math.round(spot.count * c) })),
  }
}

export const DISTRICTS: Record<number, DistrictData> = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [i + 1, buildDistrictData(i + 1)])
)

// ─── Helpers (used by the screen) ────────────────────────────────────────────

export function formatCount(n: number, period: Period): string {
  if (period === 'all') {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 10_000)    return `${Math.round(n / 1_000)}K`
  }
  if (period === 'year' && n >= 10_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
}

export function periodCountLabel(period: Period): string {
  if (period === 'month') return 'reports this month'
  if (period === 'year')  return 'reports this year'
  return 'reports since 2017'
}

// Returns the label and value for the period-specific comparison column in issue cards.
// Returns null for the 'all' period (no comparison shown).
export function vsComparison(item: IssueTypeDatum, period: Period): { label: string; value: number } | null {
  if (period === 'month') return { label: 'vs Last Month', value: item.vsMonth }
  if (period === 'year')  return { label: 'vs Last Year',  value: item.vsYear  }
  return null
}
