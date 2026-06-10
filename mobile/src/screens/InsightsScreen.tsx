import React, { useMemo, useState } from 'react'
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native'
import Svg, { Circle, Line, Path, Polyline, Text as SvgText } from 'react-native-svg'
import { districtNames, ChronicSpotV2 } from '../data/dashboard311v2'
import { useDashboardData } from '../context/DashboardContext'

// ─── Types ────────────────────────────────────────────────────────────────────
type Period     = 'month' | 'year'
type CatView    = 'fixtime' | 'resrate' | 'volume'
type TrendScale = 'month'  | 'year'

// ─── Palette ─────────────────────────────────────────────────────────────────
const D = {
  bg:       '#18191C',
  surface:  '#222428',
  surface2: '#2C2D32',
  line:     '#3A3C42',
  lineSoft: '#313338',
  text:     '#F2F3F5',
  muted:    '#8D939E',
  faint:    '#636870',
  accent:   '#5B9BF8',
  accent2:  '#7EB4F5',
  good:     '#3ECF82',
  bad:      '#E8514A',
  mid:      '#F0A030',
} as const

// ─── Icon keys & colors ───────────────────────────────────────────────────────
const CAT_KEY: Record<string, string> = {
  'Junk Pickup':         'junk',
  'Graffiti':            'graffiti',
  'Illegal Dumping':     'dumping',
  'Pothole':             'pothole',
  'Streetlight Outage':  'light',
  'Vehicle Concerns':    'vehicle',
  'Encampment Concerns': 'encampment',
  'Container Issues':    'container',
}

const CAT_COLOR: Record<string, string> = {
  junk:       '#4A8CB5',
  graffiti:   '#B05898',
  dumping:    '#C04830',
  pothole:    '#C89838',
  light:      '#B8B030',
  vehicle:    '#6855C0',
  encampment: '#38A8B8',
  container:  '#38B078',
}

const TREND_COLORS = ['#5B7DEF', '#4DC9A8', '#D4A830', '#DC6080']

// ─── SVG icon paths (24×24 viewBox, from design) ─────────────────────────────
const ICON_PATH: Record<string, string> = {
  junk:       'M3 6h18M8 6V4.2A1.2 1.2 0 0 1 9.2 3h5.6A1.2 1.2 0 0 1 16 4.2V6M6 6l.9 13.2A1.6 1.6 0 0 0 8.5 21h7A1.6 1.6 0 0 0 17.1 19.2L18 6',
  graffiti:   'M9 11V5.5a1.5 1.5 0 0 1 1.5-1.5H12M7 11h6v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM14 4l1.5 1M15.5 7l1.8.3M15 10l1.7-.6',
  dumping:    'M4 8h16l-1.2 11.2A1.8 1.8 0 0 1 17 21H7a1.8 1.8 0 0 1-1.8-1.8zM9 8V5.4A1.4 1.4 0 0 1 10.4 4h3.2A1.4 1.4 0 0 1 15 5.4V8M3 8l3-4M21 8l-3-4M10 12v5M14 12v5',
  pothole:    'M10.3 4.2 2.6 18.1A1.5 1.5 0 0 0 3.9 20.4h16.2a1.5 1.5 0 0 0 1.3-2.3L13.7 4.2a1.6 1.6 0 0 0-3.4 0ZM12 9.5v4.5M12 17v.6',
  light:      'M9.2 17.5h5.6M10 20.5h4M12 3.2a6 6 0 0 0-3.8 10.7c.7.6 1.1 1.3 1.2 2.1h5.2c.1-.8.5-1.5 1.2-2.1A6 6 0 0 0 12 3.2Z',
  vehicle:    'M3.5 13.5 5.3 8.4A2 2 0 0 1 7.2 7h9.6a2 2 0 0 1 1.9 1.4l1.8 5.1M3 13.5h18v3.5a1 1 0 0 1-1 1h-1.5M3 13.5V17a1 1 0 0 0 1 1h1.5M6.5 18a1.5 1.5 0 0 0 3 0M14.5 18a1.5 1.5 0 0 0 3 0',
  encampment: 'M3 19.5 11.4 5a.7.7 0 0 1 1.2 0L21 19.5M12 7.5v12M12 19.5l-4.5-6M12 19.5l4.5-6',
  container:  'M12 3 3.5 7v10L12 21l8.5-4V7zM3.5 7 12 11l8.5-4M12 11v10',
}

// ─── Department info (for How Issues Get Resolved sheet) ─────────────────────
const DEPT_INFO = [
  { catId: 'junk',       label: 'Junk Pickup',         dept: 'Environmental Services (ESD)',  desc: 'Crew dispatched for curbside collection' },
  { catId: 'graffiti',   label: 'Graffiti',             dept: 'Environmental Services (ESD)',  desc: 'Graffiti abatement team removes or paints over' },
  { catId: 'dumping',    label: 'Illegal Dumping',      dept: 'Environmental Services (ESD)',  desc: 'Cleanup crew sent to remove debris' },
  { catId: 'light',      label: 'Streetlight Outage',   dept: 'Dept. of Transportation (DOT)', desc: 'Electrical crew inspects and repairs' },
  { catId: 'pothole',    label: 'Pothole',              dept: 'Dept. of Transportation (DOT)', desc: 'Road crew patches or repaves' },
  { catId: 'vehicle',    label: 'Vehicle Concerns',     dept: 'Police / Code Enforcement',     desc: 'Vehicle tagged, towed if unclaimed after 72hrs' },
  { catId: 'encampment', label: 'Encampment Concerns',  dept: 'Housing Dept.',                 desc: 'Outreach team dispatched, cleanup coordinated' },
  { catId: 'container',  label: 'Container Issues',     dept: 'Environmental Services (ESD)',  desc: 'Container replaced or repositioned' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────
function CatIcon({ type, size, color }: { type: string; size: number; color: string }) {
  const d = ICON_PATH[CAT_KEY[type] ?? 'junk'] ?? ''
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function CatSquare({ type, size, radius }: { type: string; size: number; radius: number }) {
  const key  = CAT_KEY[type] ?? 'junk'
  const mc   = CAT_COLOR[key] ?? D.accent
  const icon = ICON_PATH[key] ?? ''
  const sz   = Math.round(size * 0.52)
  return (
    <View style={{
      width: size, height: size, borderRadius: radius,
      backgroundColor: mc + '28', borderWidth: 1, borderColor: mc + '55',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none">
        <Path d={icon} stroke={mc} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  )
}

function ChevRight({ size = 18, color = D.faint }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtTime(h: number): string {
  const r = Math.round(h)
  return r < 48 ? `${r} hrs` : `${Math.round(h / 24)} days`
}
function fmtNum(n: number): string { return Math.round(n).toLocaleString('en-US') }

function niceStep(range: number, ticks: number): number {
  const raw  = range / ticks
  const mag  = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))))
  const norm = raw / mag
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
}

function fmtLocation(loc: string): string {
  // Hide raw lat/lon coordinates from users (e.g. "37.3382, -121.8863")
  if (/^[\s(]*-?\d{1,3}\.\d{3,}[\s,]+\s*-?\d{1,3}\.\d{3,}/.test(loc.trim())) return 'Unknown Location'
  return loc
}

function fmtPeriodLabel(p: string): string {
  if (!p.includes('-')) return p
  const [y, m] = p.split('-')
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1] + ' \'' + y.slice(2)
}

function barColor(view: CatView, val: number, max: number): string {
  if (view === 'fixtime') return val < 24 ? D.good : val < 168 ? D.mid : D.bad
  if (view === 'resrate') return val > 85  ? D.good : val >= 60 ? D.mid : D.bad
  const t = 1 - val / max
  return t > 0.66 ? D.good : t > 0.33 ? D.mid : D.bad
}

// ─── Main component ───────────────────────────────────────────────────────────
type Props = {
  district:           number
  onDistrictChange?:  (d: number) => void
  onViewChronicSpot?: (spot: ChronicSpotV2) => void
}

export function InsightsScreen({ district, onDistrictChange, onViewChronicSpot }: Props) {
  const { dashboardV2, dashboard311 } = useDashboardData()
  const { width: W } = useWindowDimensions()

  const [period,      setPeriod]      = useState<Period>('month')
  const [catView,     setCatView]     = useState<CatView>('fixtime')
  const [trendScale,  setTrendScale]  = useState<TrendScale>('month')
  const [compareKey,  setCompareKey]  = useState<string>('cityAverage')
  const [showCompare, setShowCompare] = useState(false)
  const [showInfo,    setShowInfo]    = useState(false)

  const distStr  = String(district)
  const distData = dashboardV2.districts[distStr]
  const distComp = (dashboardV2 as any).districtComparison
  const meta     = (dashboardV2 as any).meta
  const v1       = (dashboard311 as any).districts?.[distStr]

  // ── Section 2: By Category ────────────────────────────────────────────────
  const catItems = period === 'month'
    ? distData.categoryComparison.month
    : distData.categoryComparison.year

  const sortedCatItems = useMemo(() => {
    if (catView === 'fixtime')
      return catItems.filter(c => c.fixTimeHours !== null)
        .sort((a, b) => (a.fixTimeHours ?? 0) - (b.fixTimeHours ?? 0))
    if (catView === 'resrate')
      return [...catItems].sort((a, b) => b.resolutionRate - a.resolutionRate)
    return [...catItems].sort((a, b) => b.volume - a.volume)
  }, [catItems, catView])

  const barMax = useMemo(() => {
    if (catView === 'fixtime') {
      const vals = catItems.filter(c => c.fixTimeHours !== null).map(c => c.fixTimeHours as number)
      return Math.max(...vals, 1)
    }
    if (catView === 'resrate') return 100
    return Math.max(...catItems.map(c => c.volume), 1)
  }, [catItems, catView])

  // ── Section 3: Top Issues ─────────────────────────────────────────────────
  const topIssues = useMemo(() => {
    if (period === 'month') return distData.topIssues.slice(0, 5)
    return [...distData.categoryComparison.year]
      .sort((a, b) => b.volume - a.volume).slice(0, 5)
      .map(c => ({ type: c.type, count: c.volume }))
  }, [period, distData])

  // ── Section 4: Trends ────────────────────────────────────────────────────
  const trendKeys = useMemo(() => Object.keys(distData.trendLines).slice(0, 4), [distData])

  const trendPts = useMemo(() => trendKeys.map((key, i) => ({
    key, color: TREND_COLORS[i % TREND_COLORS.length],
    pts: trendScale === 'month' ? distData.trendLines[key].monthly : distData.trendLines[key].yearly,
  })), [trendKeys, trendScale, distData])

  const trendChanges = useMemo(() => {
    const raw: { name: string; pct: number }[] = trendScale === 'month'
      ? (v1?.trendsVsMonth ?? []) : (v1?.trendsVsYear ?? [])
    return [...raw].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
  }, [trendScale, v1])

  const CHART_H = 158
  const padL = 32, padR = 8, padT = 12, padB = 24
  const chartW = W - 68  // 20 sec-pad × 2 + 14 card-pad × 2

  const chartAxes = useMemo(() => {
    if (!trendPts.length || !trendPts[0].pts.length) return null
    const rawMax = Math.max(...trendPts.flatMap(s => s.pts.map(p => p.count)))
    const step   = niceStep(rawMax, 4)
    const yMax   = Math.ceil(rawMax / step) * step
    return { yMax, gridN: Math.round(yMax / step) }
  }, [trendPts])

  const xLabelIdxs = useMemo(() => {
    if (!trendPts[0]?.pts.length) return []
    const n = trendPts[0].pts.length
    const step = Math.max(1, Math.round(n / 5))
    const res = new Set<number>()
    for (let i = 0; i < n; i += step) res.add(i)
    res.add(n - 1)
    return [...res].sort((a, b) => a - b)
  }, [trendPts])

  const ix = (i: number) => padL + (i / Math.max((trendPts[0]?.pts.length ?? 2) - 1, 1)) * (chartW - padL - padR)
  const iy = (v: number, yMax: number) => padT + (1 - v / yMax) * (CHART_H - padT - padB)

  // ── Section 5: Comparison ────────────────────────────────────────────────
  const effCmpKey = compareKey === distStr ? 'cityAverage' : compareKey
  const cmpLabel  = effCmpKey === 'cityAverage' ? 'City Average' : `District ${effCmpKey}`

  const myMetrics  = period === 'month' ? distComp.month[distStr]  : distComp.year[distStr]
  const cmpRaw     = effCmpKey === 'cityAverage'
    ? (period === 'month' ? distComp.cityAverage.month : distComp.cityAverage.year)
    : (period === 'month' ? distComp.month[effCmpKey]  : distComp.year[effCmpKey])
  const cmpMetrics = effCmpKey === 'cityAverage' && cmpRaw
    ? { ...cmpRaw, totalReports: Math.round(cmpRaw.totalReports / 10) }
    : cmpRaw

  // ── Section 6: Recurring ─────────────────────────────────────────────────
  const topRecur = useMemo(
    () => [...distData.recurringIssues]
      .filter(s => !s.location.includes('°') && fmtLocation(s.location) !== 'Unknown Location')
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    [distData],
  )

  const navigateTo = (spot: ChronicSpotV2) =>
    onViewChronicSpot?.({
      ...spot,
      timelineEvents: [...spot.timelineEvents].sort((a, b) => a.date.localeCompare(b.date)),
    })

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: D.bg }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Compare picker modal ── */}
      <Modal visible={showCompare} transparent animationType="slide" onRequestClose={() => setShowCompare(false)}>
        <Pressable style={s.overlay} onPress={() => setShowCompare(false)}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Compare With</Text>
            <ScrollView bounces={false}>
              <Pressable
                style={[s.sheetRow, effCmpKey === 'cityAverage' && s.sheetRowSel]}
                onPress={() => { setCompareKey('cityAverage'); setShowCompare(false) }}
              >
                <Text style={[s.sheetRowTitle, effCmpKey === 'cityAverage' && { color: D.text }]}>City Average</Text>
                {effCmpKey === 'cityAverage' && <Text style={{ color: D.good, fontSize: 16 }}>✓</Text>}
              </Pressable>
              {Array.from({ length: 10 }, (_, i) => String(i + 1)).filter(k => k !== distStr).map(k => (
                <Pressable
                  key={k}
                  style={[s.sheetRow, effCmpKey === k && s.sheetRowSel]}
                  onPress={() => { setCompareKey(k); setShowCompare(false) }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sheetRowTitle, effCmpKey === k && { color: D.text }]}>District {k}</Text>
                    <Text style={s.sheetRowSub}>{districtNames[k]}</Text>
                  </View>
                  {effCmpKey === k && <Text style={{ color: D.good, fontSize: 16 }}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* ── How Issues Get Resolved modal ── */}
      <Modal visible={showInfo} transparent animationType="slide" onRequestClose={() => setShowInfo(false)}>
        <Pressable style={s.overlay} onPress={() => setShowInfo(false)}>
          <View style={s.infoSheet}>
            <View style={s.sheetHandle} />
            <Text style={s.infoSheetTitle}>How Issues Get Resolved</Text>
            <Text style={s.infoDesc}>
              When you report an issue through CityFix, it gets routed to the responsible San Jose city department. Each department has its own process and timeline for resolution. The fix times and resolution rates you see on the dashboard are based on 9 years of real 311 data — here's who handles what.
            </Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {DEPT_INFO.map(({ catId, label, dept, desc }) => {
                const color = CAT_COLOR[catId] ?? D.accent
                const iconD = ICON_PATH[catId] ?? ''
                return (
                  <View key={catId} style={s.infoRow}>
                    <View style={[s.infoIconWrap, { backgroundColor: color + '28', borderColor: color + '55' }]}>
                      <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                        <Path d={iconD} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                    <View style={s.infoRowText}>
                      <View style={s.infoRowTop}>
                        <Text style={s.infoRowLabel}>{label}</Text>
                        <Text style={s.infoRowDept} numberOfLines={1}>{dept}</Text>
                      </View>
                      <Text style={s.infoRowDesc}>{desc}</Text>
                    </View>
                  </View>
                )
              })}
              <Pressable style={s.infoCloseBtn} onPress={() => setShowInfo(false)}>
                <Text style={s.infoCloseTxt}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* ════ SECTION 1: Period toggle ════ */}
      <View style={s.pad}>
        <View style={s.periodWrap}>
          <View style={s.pillset}>
            {(['month', 'year'] as Period[]).map(p => (
              <Pressable key={p} style={[s.pill, period === p && s.pillOn]} onPress={() => setPeriod(p)}>
                <Text style={[s.pillText, period === p && s.pillTextOn]}>
                  {p === 'month' ? 'This Month' : 'This Year'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* ════ SECTIONS 2 & 3: Period-controlled (left blue border) ════ */}
      <View style={s.controlledGroup}>

        {/* ── Section 2: By Category ── */}
        <View style={{ marginTop: 6 }}>
          <View style={s.secTitle}>
            <View style={s.secTitleLeft}>
              <Text style={s.secH2}>By Category</Text>
              <Pressable onPress={() => setShowInfo(true)} hitSlop={10}>
                <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="9" stroke={D.muted} strokeWidth={1.7} />
                  <Path d="M12 11v5" stroke={D.muted} strokeWidth={1.8} strokeLinecap="round" />
                  <Circle cx="12" cy="7.8" r="1" fill={D.muted} />
                </Svg>
              </Pressable>
            </View>
            <Text style={s.secRight}>{period === 'month' ? 'This month' : 'This year'}</Text>
          </View>
          <View style={s.seg}>
            {([['fixtime','Fix Time'],['resrate','Resolution Rate'],['volume','Volume']] as [CatView,string][]).map(([k,lbl]) => (
              <Pressable key={k} style={[s.segBtn, catView === k && s.segBtnOn]} onPress={() => setCatView(k)}>
                <Text style={[s.segText, catView === k && s.segTextOn]}>{lbl}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ gap: 14 }}>
            {sortedCatItems.map(item => {
              const raw   = catView === 'fixtime' ? item.fixTimeHours!
                          : catView === 'resrate'  ? item.resolutionRate
                          : item.volume
              const frac  = catView === 'resrate' ? raw / 100 : raw / barMax
              const color = barColor(catView, raw, barMax)
              const label = catView === 'fixtime' ? fmtTime(item.fixTimeHours!)
                          : catView === 'resrate'  ? `${item.resolutionRate}%`
                          : fmtNum(item.volume)
              return (
                <View key={item.type}>
                  <View style={s.barTopRow}>
                    <CatIcon type={item.type} size={15} color={D.faint} />
                    <Text style={s.barName}>{item.type}</Text>
                    <Text style={s.barVal}>{label}</Text>
                  </View>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${Math.round(frac * 100)}%` as any, backgroundColor: color }]} />
                  </View>
                </View>
              )
            })}
          </View>
          <View style={s.legendNote}>
            {([['good','Doing well'],['mid','Watch'],['bad','Falling behind']] as const).map(([k,lbl]) => (
              <View key={k} style={s.legendSwatch}>
                <View style={[s.legendBox, { backgroundColor: D[k] }]} />
                <Text style={s.legendText}>{lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Section 3: Top Issues ── */}
        <View style={{ marginTop: 28 }}>
          <View style={s.secTitle}>
            <Text style={s.secH2}>Top Issues Right Now</Text>
            <Text style={s.secRight}>{period === 'month' ? 'This month' : 'This year'}</Text>
          </View>
          {topIssues.map((issue, i) => (
            <View key={issue.type} style={[s.rankRow, i < topIssues.length - 1 && s.rankRowBorder]}>
              <Text style={s.rankNum}>{i + 1}</Text>
              <CatIcon type={issue.type} size={18} color={D.accent2} />
              <Text style={s.rankName}>{issue.type}</Text>
              <Text style={s.rankCount}>
                {fmtNum(issue.count)}<Text style={s.rankSmall}> reports</Text>
              </Text>
            </View>
          ))}
        </View>

      </View>

      <View style={s.divider} />

      {/* ════ SECTION 4: Trends ════ */}
      <View style={s.sec}>
        <View style={s.secTitle}>
          <Text style={s.secH2}>Trends</Text>
        </View>
        <View style={[s.seg, { marginBottom: 14 }]}>
          {([['month','vs Last Month'],['year','vs Last Year']] as [TrendScale,string][]).map(([k,lbl]) => (
            <Pressable key={k} style={[s.segBtn, trendScale === k && s.segBtnOn]} onPress={() => setTrendScale(k)}>
              <Text style={[s.segText, trendScale === k && s.segTextOn]}>{lbl}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.chartCard}>
          {chartAxes && trendPts.length > 0 && trendPts[0].pts.length > 1 && (
            <Svg width={chartW} height={CHART_H}>
              {Array.from({ length: chartAxes.gridN + 1 }, (_, g) => {
                const v   = Math.round(chartAxes.yMax * g / chartAxes.gridN)
                const y   = iy(v, chartAxes.yMax)
                const lbl = v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v)
                return (
                  <React.Fragment key={g}>
                    <Line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke={D.lineSoft} strokeWidth={1} />
                    <SvgText x={padL - 4} y={y + 3.5} textAnchor="end" fontSize={9} fill={D.faint}>{lbl}</SvgText>
                  </React.Fragment>
                )
              })}
              {trendPts.map((s, si) => {
                const n   = s.pts.length
                const pts = s.pts.map((p, i) => `${ix(i).toFixed(1)},${iy(p.count, chartAxes.yMax).toFixed(1)}`).join(' ')
                const lx  = ix(n - 1)
                const ly  = iy(s.pts[n - 1].count, chartAxes.yMax)
                return (
                  <React.Fragment key={si}>
                    <Polyline points={pts} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx={lx} cy={ly} r={3} fill={s.color} stroke={D.surface} strokeWidth={1.5} />
                  </React.Fragment>
                )
              })}
              {xLabelIdxs.map(idx => (
                <SvgText
                  key={idx}
                  x={ix(idx)}
                  y={CHART_H - 6}
                  textAnchor="middle"
                  fontSize={9.5}
                  fill={D.faint}
                >
                  {fmtPeriodLabel(trendPts[0].pts[idx].period)}
                </SvgText>
              ))}
            </Svg>
          )}
          <View style={s.trendLegend}>
            {trendKeys.map((key, i) => {
              const ch  = trendChanges.find(t => t.name === key)
              const up  = (ch?.pct ?? 0) > 0
              return (
                <View key={key} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: TREND_COLORS[i % TREND_COLORS.length] }]} />
                  <Text style={s.legendItemName} numberOfLines={1}>{key}</Text>
                  {ch && (
                    <Text style={[s.legendPct, { color: up ? D.bad : D.good }]}>
                      {up ? '↑' : '↓'}{Math.abs(ch.pct)}%
                    </Text>
                  )}
                </View>
              )
            })}
          </View>
        </View>
      </View>

      <View style={s.divider} />

      {/* ════ SECTION 5: District Comparison ════ */}
      <View style={s.sec}>
        <View style={s.compareHead}>
          <Text style={s.secH2}>District Comparison</Text>
          <Pressable style={s.cmpBtn} onPress={() => setShowCompare(true)}>
            <Text style={s.cmpBtnText}>{cmpLabel}</Text>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke={D.accent2} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>
        <View style={s.chartCard}>
          <View style={s.cmpHeader}>
            <View style={s.cmpLabelRow}>
              <View style={[s.cmpDot, { backgroundColor: D.accent }]} />
              <Text style={[s.cmpLabelText, { color: D.text }]}>District {district}</Text>
            </View>
            <View style={s.cmpLabelRow}>
              <View style={[s.cmpDot, { backgroundColor: D.muted }]} />
              <Text style={[s.cmpLabelText, { color: D.muted }]}>{cmpLabel}</Text>
            </View>
          </View>
          {myMetrics && cmpMetrics && (
            [
              { label: 'Resolution Rate',
                aVal: myMetrics.resolutionRate,          bVal: cmpMetrics.resolutionRate,
                aStr: `${myMetrics.resolutionRate}%`,    bStr: `${cmpMetrics.resolutionRate}%`,
                max: 100 },
              { label: 'Avg Fix Time',
                aVal: myMetrics.avgFixTimeHours ?? 0,    bVal: cmpMetrics.avgFixTimeHours ?? 0,
                aStr: myMetrics.avgFixTimeHours   != null ? fmtTime(myMetrics.avgFixTimeHours)  : 'N/A',
                bStr: cmpMetrics.avgFixTimeHours  != null ? fmtTime(cmpMetrics.avgFixTimeHours) : 'N/A',
                max: Math.max(myMetrics.avgFixTimeHours ?? 0, cmpMetrics.avgFixTimeHours ?? 0) * 1.15 || 1 },
              { label: 'Total Reports',
                aVal: myMetrics.totalReports,            bVal: cmpMetrics.totalReports,
                aStr: fmtNum(myMetrics.totalReports),    bStr: fmtNum(cmpMetrics.totalReports),
                max: Math.max(myMetrics.totalReports, cmpMetrics.totalReports) * 1.1 || 1 },
            ].map(m => {
              const wa = Math.max(3, Math.min(100, m.aVal / m.max * 100))
              const wb = Math.max(3, Math.min(100, m.bVal / m.max * 100))
              return (
                <View key={m.label} style={s.metric}>
                  <View style={s.metricHead}>
                    <Text style={s.metricLabel}>{m.label}</Text>
                    <Text style={s.metricVals}>
                      <Text style={{ color: D.text, fontWeight: '500' }}>{m.aStr}</Text>
                      <Text style={{ color: D.muted }}>{' vs '}</Text>
                      <Text style={{ color: D.muted, fontWeight: '500' }}>{m.bStr}</Text>
                    </Text>
                  </View>
                  <View style={{ gap: 6 }}>
                    <View style={s.pbTrack}><View style={[s.pbFill, { width: `${Math.round(wa)}%` as any, backgroundColor: D.accent }]} /></View>
                    <View style={s.pbTrack}><View style={[s.pbFill, { width: `${Math.round(wb)}%` as any, backgroundColor: D.muted }]} /></View>
                  </View>
                </View>
              )
            })
          )}
        </View>
      </View>

      <View style={s.divider} />

      {/* ════ SECTION 6: Recurring Issues ════ */}
      <View style={s.sec}>
        <View style={s.secTitle}>
          <Text style={s.secH2}>Recurring Issues</Text>
          <Text style={s.secRight}>Since 2017</Text>
        </View>
        <View style={{ gap: 10 }}>
          {topRecur.map((spot, i) => (
            <Pressable key={`${i}:${spot.issueType}:${spot.location}`} style={s.recurItem} onPress={() => navigateTo(spot)}>
              <CatSquare type={spot.issueType} size={38} radius={10} />
              <View style={s.recurBody}>
                <Text style={s.recurTitle}>{spot.location}</Text>
                <Text style={s.recurLoc}>{spot.issueType}</Text>
                <Text style={s.recurMeta}>
                  <Text style={{ color: D.text, fontWeight: '600' }}>{fmtNum(spot.count)}</Text>
                  {' reports · '}
                  <Text style={{ color: D.text, fontWeight: '600' }}>{spot.reopenCount}</Text>
                  {` recurrences since ${spot.since}`}
                </Text>
                {spot.maxConsecYears >= 9 && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>↻ Reported every year since {spot.since}</Text>
                  </View>
                )}
              </View>
              <View style={{ flexShrink: 0, marginTop: 2 }}>
                <ChevRight size={18} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={s.footer}>CityFix · San José 311 · data refreshed today</Text>
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Modals
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#222428', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, maxHeight: '72%' },
  sheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: '#3A3C42', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetTitle:   { color: '#8D939E', fontSize: 12, fontWeight: '700', letterSpacing: 1, textAlign: 'center', paddingVertical: 12 },
  sheetRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#313338' },
  sheetRowSel:  { backgroundColor: '#2C2D32' },
  sheetRowTitle:{ flex: 1, color: '#8D939E', fontSize: 15, fontWeight: '700' },
  sheetRowSub:  { color: '#636870', fontSize: 12, marginTop: 1 },

  // Section 1
  pad:         { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  periodWrap:  { marginTop: 16 },
  pillset:     { flexDirection: 'row', backgroundColor: '#222428', borderWidth: 1, borderColor: '#313338', borderRadius: 11, padding: 3, gap: 2, alignSelf: 'flex-start' },
  pill:        { paddingHorizontal: 15, paddingVertical: 7, borderRadius: 8 },
  pillOn:      { backgroundColor: '#5B9BF8' },
  pillText:    { fontSize: 13, fontWeight: '600', color: '#8D939E' },
  pillTextOn:  { color: '#fff' },

  // Controlled group (left blue border)
  controlledGroup: {
    marginLeft: 20, marginRight: 20, marginTop: 18, marginBottom: 4,
    borderLeftWidth: 2, borderLeftColor: '#5B9BF8', paddingLeft: 14,
  },

  // Generic section
  sec:     { paddingHorizontal: 20 },
  secTitle:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  secTitleLeft:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  secH2:       { fontSize: 13, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', color: '#8D939E' },
  secRight:    { fontSize: 12, color: '#636870' },

  // Segmented control
  seg:       { flexDirection: 'row', backgroundColor: '#222428', borderWidth: 1, borderColor: '#313338', borderRadius: 10, padding: 3, gap: 2, marginBottom: 16 },
  segBtn:    { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 7, alignItems: 'center' },
  segBtnOn:  { backgroundColor: '#2C2D32' },
  segText:   { fontSize: 12, fontWeight: '600', color: '#8D939E' },
  segTextOn: { color: '#F2F3F5' },

  // Bar chart
  barTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  barName:   { flex: 1, fontSize: 13, fontWeight: '500', color: '#F2F3F5' },
  barVal:    { fontSize: 12.5, fontWeight: '500', color: '#8D939E' },
  barTrack:  { height: 10, borderRadius: 6, backgroundColor: '#2C2D32', overflow: 'hidden' },
  barFill:   { height: 10, borderRadius: 6 },

  // Bar legend
  legendNote:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  legendSwatch: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendBox:    { width: 9, height: 9, borderRadius: 3 },
  legendText:   { fontSize: 11, color: '#636870' },

  // Ranked list
  rankRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rankRowBorder: { borderBottomWidth: 1, borderBottomColor: '#313338' },
  rankNum:       { fontSize: 13, fontWeight: '600', color: '#636870', width: 14, textAlign: 'center' },
  rankName:      { flex: 1, fontSize: 14, fontWeight: '500', color: '#F2F3F5' },
  rankCount:     { fontSize: 13.5, fontWeight: '500', color: '#F2F3F5' },
  rankSmall:     { fontSize: 12, color: '#636870', fontWeight: '400' },

  // Dividers
  divider: { height: 1, backgroundColor: '#313338', marginHorizontal: 20, marginVertical: 26 },

  // Chart card
  chartCard: { backgroundColor: '#222428', borderWidth: 1, borderColor: '#313338', borderRadius: 16, padding: 16, paddingHorizontal: 14, paddingBottom: 14 },

  // Trend legend
  trendLegend:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, rowGap: 12, marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#313338' },
  legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 7, width: '46%' },
  legendDot:      { width: 18, height: 3, borderRadius: 2, flexShrink: 0 },
  legendItemName: { flex: 1, fontSize: 12, color: '#8D939E' },
  legendPct:      { fontSize: 12, fontWeight: '600', flexShrink: 0 },

  // Comparison
  compareHead:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cmpBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2C2D32', borderWidth: 1, borderColor: '#3A3C42', borderRadius: 9, paddingVertical: 7, paddingHorizontal: 11 },
  cmpBtnText:   { fontSize: 12.5, fontWeight: '600', color: '#7EB4F5' },
  cmpHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  cmpLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cmpDot:       { width: 10, height: 10, borderRadius: 3 },
  cmpLabelText: { fontSize: 12.5, fontWeight: '600' },
  metric:       { marginBottom: 16 },
  metricHead:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metricLabel:  { fontSize: 12, color: '#8D939E' },
  metricVals:   { fontSize: 12 },
  pbTrack:      { height: 8, borderRadius: 5, backgroundColor: '#2C2D32', overflow: 'hidden' },
  pbFill:       { height: 8, borderRadius: 5 },

  // Recurring volume
  recurItem:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#222428', borderWidth: 1, borderColor: '#313338', borderRadius: 14, padding: 14 },
  recurBody:  { flex: 1, minWidth: 0 },
  recurTitle: { fontSize: 15, fontWeight: '600', color: '#F2F3F5', letterSpacing: -0.1 },
  recurLoc:   { fontSize: 12.5, color: '#636870', marginTop: 2 },
  recurMeta:  { fontSize: 12.5, color: '#8D939E', marginTop: 7 },
  badge:      { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginTop: 9, backgroundColor: 'rgba(91,155,248,0.14)', borderWidth: 1, borderColor: 'rgba(91,155,248,0.3)', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 9 },
  badgeText:  { fontSize: 10.5, fontWeight: '600', color: '#7EB4F5', letterSpacing: 0.2 },

  // Footer
  footer: { textAlign: 'center', fontSize: 10.5, color: '#636870', paddingTop: 24, paddingBottom: 18, paddingHorizontal: 20, letterSpacing: 0.2 },

  // ── How Issues Get Resolved sheet
  infoSheet:     { backgroundColor: D.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36, maxHeight: '82%' },
  infoSheetTitle:{ color: D.text, fontSize: 17, fontWeight: '700', marginHorizontal: 20, marginTop: 4, marginBottom: 12 },
  infoDesc:      { color: D.muted, fontSize: 12.5, lineHeight: 18, marginHorizontal: 20, marginBottom: 16 },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingVertical: 11, borderTopWidth: 1, borderTopColor: D.line },
  infoIconWrap:  { width: 34, height: 34, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  infoRowText:   { flex: 1, minWidth: 0 },
  infoRowTop:    { flexDirection: 'row', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' },
  infoRowLabel:  { fontSize: 13.5, fontWeight: '600', color: D.text },
  infoRowDept:   { fontSize: 11.5, color: D.muted, flexShrink: 1 },
  infoRowDesc:   { fontSize: 11.5, color: D.faint, marginTop: 2, lineHeight: 16 },
  infoCloseBtn:  { marginHorizontal: 20, marginTop: 20, backgroundColor: D.surface2, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  infoCloseTxt:  { color: D.text, fontSize: 14, fontWeight: '600' },
})
