import { useMemo, useState } from 'react'
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native'
import { dashboardV2, districtNames, ChronicSpotV2 } from '../data/dashboard311v2'
import { dashboard311 } from '../data/dashboard311'

type Period   = 'month' | 'year'
type CatMetric = 'fixTime' | 'resRate' | 'volume'
type TrendWin  = 'month' | 'year'
type RecurView = 'volume' | 'type'

// ─── Palette ──────────────────────────────────────────────────────────────────
const D = {
  bg:          '#18191C',
  surface:     '#222428',
  surfaceHigh: '#2C2D32',
  border:      '#35373D',
  text1:       '#F2F3F5',
  text2:       '#8D939E',
  text3:       '#55595F',
  red:         '#E8514A',
  green:       '#3ECF82',
  amber:       '#F0A030',
  accent:      '#5B9BF8',
} as const

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const CAT_ICON: Record<string, string> = {
  'Junk Pickup':         '🗑️',
  'Graffiti':            '🎨',
  'Illegal Dumping':     '🚯',
  'Pothole':             '🕳️',
  'Streetlight Outage':  '💡',
  'Vehicle Concerns':    '🚗',
  'Encampment Concerns': '⛺',
  'Container Issues':    '📦',
}

const TREND_COLORS = ['#5B7DEF', '#4DC9A8', '#DC6080', '#C8A835']

// Chart layout constants
const CHART_PAD_L = 36
const CHART_PAD_R = 4
const CHART_PAD_T = 12
const CHART_PAD_B = 24
const CHART_H     = 150

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtFixTime(hours: number): string {
  const h = Math.round(hours)
  return h < 48 ? `${h} hrs` : `${Math.round(hours / 24)} days`
}

function rateColor(pct: number): string {
  return pct >= 85 ? D.green : pct >= 60 ? D.amber : D.red
}

function fixTimeColor(hours: number): string {
  const t = 1 - Math.max(0, Math.min(1,
    (Math.log(Math.max(1, hours)) - Math.log(12)) / (Math.log(336) - Math.log(12))
  ))
  return t >= 0.66 ? D.green : t >= 0.33 ? D.amber : D.red
}

function fmtPeriodLabel(period: string): string {
  if (period.includes('-')) {
    const [y, m] = period.split('-')
    return `${MONTHS_SHORT[Number(m) - 1]} '${y.slice(2)}`
  }
  return period
}

function niceStep(range: number, ticks: number): number {
  const raw  = range / ticks
  const mag  = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))))
  const norm = raw / mag
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return nice * mag
}

// ─── Rotated-View line chart ──────────────────────────────────────────────────
type LineChartProps = {
  series:     { color: string; points: { x: number; y: number }[] }[]
  width:      number
  height:     number
  gridlines?: { y: number }[]
  gridLeft?:  number
}

function LineChart({ series, width, height, gridlines, gridLeft = 0 }: LineChartProps) {
  return (
    <View style={{ width, height, position: 'relative' }}>
      {gridlines?.map((gl, gi) => (
        <View
          key={`gl-${gi}`}
          style={{
            position: 'absolute', left: gridLeft, right: 0,
            top: Math.round(gl.y), height: 1,
            backgroundColor: D.border,
          }}
        />
      ))}
      {series.map((s, si) =>
        s.points.slice(0, -1).map((p, i) => {
          const nx = s.points[i + 1].x
          const ny = s.points[i + 1].y
          const dx = nx - p.x
          const dy = ny - p.y
          const len   = Math.sqrt(dx * dx + dy * dy)
          const angle = Math.atan2(dy, dx) * (180 / Math.PI)
          return (
            <View
              key={`${si}-${i}`}
              style={{
                position:        'absolute',
                left:            (p.x + nx) / 2 - len / 2,
                top:             (p.y + ny) / 2 - 1,
                width:           len,
                height:          2,
                backgroundColor: s.color,
                borderRadius:    1,
                transform:       [{ rotate: `${angle}deg` }],
              }}
            />
          )
        })
      )}
    </View>
  )
}

// ─── InsightsTab ──────────────────────────────────────────────────────────────
type Props = {
  district:           number
  onDistrictChange?:  (d: number) => void
  onViewChronicSpot?: (spot: ChronicSpotV2) => void
}

export function InsightsTab({ district, onDistrictChange, onViewChronicSpot }: Props) {
  const { width: screenWidth } = useWindowDimensions()

  const [period,      setPeriod]      = useState<Period>('month')
  const [catMetric,   setCatMetric]   = useState<CatMetric>('fixTime')
  const [trendWin,    setTrendWin]    = useState<TrendWin>('month')
  const [compareKey,  setCompareKey]  = useState<string>('cityAverage')
  const [showCompare, setShowCompare] = useState(false)
  const [recurView,   setRecurView]   = useState<RecurView>('volume')
  // undefined = uninitialized (first group open); null = all closed; string = that type open
  const [openType, setOpenType] = useState<string | null | undefined>(undefined)

  const distStr  = String(district)
  const distData = dashboardV2.districts[distStr]
  const distComp = dashboardV2.districtComparison
  const meta     = dashboardV2.meta
  const v1Dist   = (dashboard311 as any).districts?.[distStr]

  // ── Category data (period-controlled) ────────────────────────────────────
  const catItems = period === 'month'
    ? distData.categoryComparison.month
    : distData.categoryComparison.year

  const sortedCatItems = useMemo(() => {
    if (catMetric === 'fixTime')
      return catItems
        .filter(c => c.fixTimeHours !== null)
        .sort((a, b) => (b.fixTimeHours ?? 0) - (a.fixTimeHours ?? 0))
    if (catMetric === 'resRate') return [...catItems].sort((a, b) => a.resolutionRate - b.resolutionRate)
    return [...catItems].sort((a, b) => b.volume - a.volume)
  }, [catItems, catMetric])

  const barMax = useMemo(() => {
    if (catMetric === 'fixTime') {
      const vals = catItems.filter(c => c.fixTimeHours !== null).map(c => c.fixTimeHours as number)
      return Math.max(...vals, 1)
    }
    if (catMetric === 'resRate') return 100
    return Math.max(...catItems.map(c => c.volume), 1)
  }, [catItems, catMetric])

  // ── Top issues (period-controlled) ────────────────────────────────────────
  const topIssues = useMemo(() => {
    if (period === 'month') return distData.topIssues.slice(0, 5)
    return [...distData.categoryComparison.year]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)
      .map(c => ({ type: c.type, count: c.volume, icon: CAT_ICON[c.type] ?? '📋' }))
  }, [period, distData])

  // ── Trend chart ────────────────────────────────────────────────────────────
  const trendKeys = useMemo(
    () => distData.topIssues.slice(0, 4).map(t => t.type).filter(k => distData.trendLines[k]),
    [distData],
  )

  const trendPts = useMemo(() => trendKeys.map((key, i) => {
    const pts = trendWin === 'month'
      ? (distData.trendLines[key]?.monthly ?? [])
      : (distData.trendLines[key]?.yearly ?? [])
    return { key, color: TREND_COLORS[i % TREND_COLORS.length], pts }
  }), [trendKeys, trendWin, distData])

  const chartW = screenWidth - 64   // 16 screen pad + 16 card pad each side

  const chartAxes = useMemo(() => {
    if (trendPts.length === 0 || trendPts[0].pts.length === 0) return null
    const allCounts = trendPts.flatMap(s => s.pts.map(p => p.count))
    const rawMax = Math.max(...allCounts)
    const step   = niceStep(rawMax, 4)
    const yMax   = Math.ceil(rawMax / step) * step
    const gridN  = Math.round(yMax / step)
    return { yMax, gridN }
  }, [trendPts])

  const chartGridlines = useMemo(() => {
    if (!chartAxes) return []
    return Array.from({ length: chartAxes.gridN + 1 }, (_, g) => {
      const v = Math.round(chartAxes.yMax * g / chartAxes.gridN)
      const y = CHART_PAD_T + (1 - v / chartAxes.yMax) * (CHART_H - CHART_PAD_T - CHART_PAD_B)
      return { y, v }
    })
  }, [chartAxes])

  const chartSeries = useMemo(() => {
    if (!chartAxes || trendPts.length === 0 || trendPts[0].pts.length === 0) return []
    const xCount = trendPts[0].pts.length
    return trendPts.map(s => ({
      color:  s.color,
      points: s.pts.map((p, i) => ({
        x: CHART_PAD_L + (i / Math.max(xCount - 1, 1)) * (chartW - CHART_PAD_L - CHART_PAD_R),
        y: CHART_PAD_T + (1 - p.count / chartAxes.yMax) * (CHART_H - CHART_PAD_T - CHART_PAD_B),
      })),
    }))
  }, [trendPts, chartAxes, chartW])

  const trendXLabels = useMemo(() => {
    if (trendPts.length === 0) return []
    const pts = trendPts[0].pts
    if (pts.length < 2) return []
    return [pts[0], pts[pts.length - 1]].map(p => fmtPeriodLabel(p.period))
  }, [trendPts])

  const trendChanges = trendWin === 'month'
    ? (v1Dist?.trendsVsMonth ?? [])
    : (v1Dist?.trendsVsYear  ?? [])

  // ── District comparison (always month) ────────────────────────────────────
  const effectiveCmpKey = compareKey === distStr ? 'cityAverage' : compareKey
  const myMonth   = distComp.month[distStr]
  const myYear    = distComp.year[distStr]
  const cmpLabel  = effectiveCmpKey === 'cityAverage' ? 'City Avg' : `D${effectiveCmpKey}`

  const cmpMonth = effectiveCmpKey === 'cityAverage'
    ? distComp.cityAverage.month
    : distComp.month[effectiveCmpKey]
  const cmpYear  = effectiveCmpKey === 'cityAverage'
    ? distComp.cityAverage.year
    : distComp.year[effectiveCmpKey]

  const myMetrics  = period === 'month' ? myMonth  : myYear
  const cmpMetrics = period === 'month' ? cmpMonth : cmpYear

  // ── Recurring issues ──────────────────────────────────────────────────────
  const recurIssues = distData.recurringIssues

  const recurByType = useMemo(() => {
    const groups: Record<string, ChronicSpotV2[]> = {}
    for (const spot of recurIssues) {
      if (!groups[spot.issueType]) groups[spot.issueType] = []
      groups[spot.issueType].push(spot)
    }
    return groups
  }, [recurIssues])

  const typeKeys = useMemo(
    () => Object.keys(recurByType).sort((a, b) => recurByType[b].length - recurByType[a].length),
    [recurByType],
  )
  const openTypeKey = openType === undefined ? (typeKeys[0] ?? null) : openType

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* ── Compare picker modal ── */}
      <Modal visible={showCompare} transparent animationType="slide" onRequestClose={() => setShowCompare(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowCompare(false)}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Compare With</Text>
            <ScrollView bounces={false}>
              <Pressable
                style={[s.cmpRow, effectiveCmpKey === 'cityAverage' && s.cmpRowActive]}
                onPress={() => { setCompareKey('cityAverage'); setShowCompare(false) }}
              >
                <Text style={[s.cmpRowLabel, effectiveCmpKey === 'cityAverage' && { color: D.text1 }]}>City Average</Text>
                {effectiveCmpKey === 'cityAverage' && <Text style={s.cmpCheck}>✓</Text>}
              </Pressable>
              {Array.from({ length: 10 }, (_, i) => String(i + 1))
                .filter(k => k !== distStr)
                .map(k => (
                  <Pressable
                    key={k}
                    style={[s.cmpRow, effectiveCmpKey === k && s.cmpRowActive]}
                    onPress={() => { setCompareKey(k); setShowCompare(false) }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cmpRowLabel, effectiveCmpKey === k && { color: D.text1 }]}>District {k}</Text>
                      <Text style={s.cmpRowSub}>{districtNames[k]}</Text>
                    </View>
                    {effectiveCmpKey === k && <Text style={s.cmpCheck}>✓</Text>}
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* ── 1. District header ── */}
      <View style={s.distHeader}>
        <Text style={s.distEyebrow}>DISTRICT {district}</Text>
        <Text style={s.distName}>{districtNames[distStr]}</Text>
        <View style={s.pillRow}>
          {(['month', 'year'] as Period[]).map(p => (
            <Pressable
              key={p}
              style={[s.pill, period === p && s.pillActive]}
              onPress={() => setPeriod(p)}
              accessibilityRole="button"
            >
              <Text style={[s.pillText, period === p && s.pillTextActive]}>
                {p === 'month' ? 'This Month' : 'This Year'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── 2. By Category ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>By Category</Text>
          <Text style={s.cardSub}>{period === 'month' ? 'This Month' : 'This Year'}</Text>
        </View>
        <View style={s.segRow}>
          {([
            ['fixTime', 'Fix Time'],
            ['resRate', 'Res. Rate'],
            ['volume',  'Volume'],
          ] as [CatMetric, string][]).map(([key, label]) => (
            <Pressable
              key={key}
              style={[s.seg, catMetric === key && s.segActive]}
              onPress={() => setCatMetric(key)}
              accessibilityRole="button"
            >
              <Text style={[s.segText, catMetric === key && s.segTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {sortedCatItems.map(item => {
          const raw    = catMetric === 'fixTime' ? item.fixTimeHours!
                       : catMetric === 'resRate'  ? item.resolutionRate
                       : item.volume
          const frac   = raw / barMax
          const color  = catMetric === 'fixTime' ? fixTimeColor(item.fixTimeHours!)
                       : catMetric === 'resRate'  ? rateColor(item.resolutionRate)
                       : D.accent
          const valStr = catMetric === 'fixTime' ? fmtFixTime(item.fixTimeHours!)
                       : catMetric === 'resRate'  ? `${item.resolutionRate}%`
                       : item.volume.toLocaleString()
          return (
            <View key={item.type} style={s.barRow}>
              <View style={s.barTopRow}>
                <Text style={s.barIcon}>{CAT_ICON[item.type] ?? '📋'}</Text>
                <Text style={s.barName} numberOfLines={1}>{item.type}</Text>
                <Text style={[s.barVal, { color }]}>{valStr}</Text>
              </View>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${frac * 100}%` as any, backgroundColor: color }]} />
              </View>
            </View>
          )
        })}
        <View style={s.legendNote}>
          <View style={s.legendNoteItem}>
            <View style={[s.legendNoteBox, { backgroundColor: D.green }]} />
            <Text style={s.legendNoteText}>Doing well</Text>
          </View>
          <View style={s.legendNoteItem}>
            <View style={[s.legendNoteBox, { backgroundColor: D.amber }]} />
            <Text style={s.legendNoteText}>Watch</Text>
          </View>
          <View style={s.legendNoteItem}>
            <View style={[s.legendNoteBox, { backgroundColor: D.red }]} />
            <Text style={s.legendNoteText}>Falling behind</Text>
          </View>
        </View>
      </View>

      {/* ── 3. Top Issues ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Top Issues</Text>
          <Text style={s.cardSub}>{period === 'month' ? 'This Month' : 'This Year'}</Text>
        </View>
        {topIssues.map((issue, i) => (
          <View
            key={issue.type}
            style={[s.topRow, i < topIssues.length - 1 && s.topRowBorder]}
          >
            <Text style={s.topRank}>#{i + 1}</Text>
            <Text style={s.topIcon}>{(issue as any).icon ?? CAT_ICON[issue.type] ?? '📋'}</Text>
            <Text style={s.topName} numberOfLines={1}>{issue.type}</Text>
            <Text style={s.topCount}>{issue.count.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* ── 4. Trends ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Trends</Text>
          <View style={s.miniSegRow}>
            {([['month', 'vs Month'], ['year', 'vs Year']] as [TrendWin, string][]).map(([k, lbl]) => (
              <Pressable
                key={k}
                style={[s.miniSeg, trendWin === k && s.miniSegActive]}
                onPress={() => setTrendWin(k)}
                accessibilityRole="button"
              >
                <Text style={[s.miniSegText, trendWin === k && s.miniSegTextActive]}>{lbl}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {chartSeries.length > 0 ? (
          <View style={{ marginVertical: 8 }}>
            <View style={{ width: chartW, height: CHART_H, position: 'relative' }}>
              <LineChart
                series={chartSeries}
                width={chartW}
                height={CHART_H}
                gridlines={chartGridlines.map(gl => ({ y: gl.y }))}
                gridLeft={CHART_PAD_L}
              />
              {chartGridlines.map((gl, i) => (
                <Text
                  key={i}
                  style={{
                    position: 'absolute', left: 0, width: CHART_PAD_L - 4,
                    top: Math.round(gl.y) - 6,
                    fontSize: 9, color: D.text3, textAlign: 'right',
                  }}
                >
                  {gl.v >= 1000 ? `${Math.round(gl.v / 100) / 10}k` : String(gl.v)}
                </Text>
              ))}
            </View>
            {trendXLabels.length === 2 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingLeft: CHART_PAD_L }}>
                <Text style={s.axisLabel}>{trendXLabels[0]}</Text>
                <Text style={s.axisLabel}>{trendXLabels[1]}</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={[s.emptyText, { marginVertical: 12 }]}>No trend data available.</Text>
        )}

        <View style={s.legendGrid}>
          {trendKeys.map((key, i) => {
            const change = (trendChanges as { name: string; pct: number }[]).find(t => t.name === key)
            const isUp   = (change?.pct ?? 0) > 0
            return (
              <View key={key} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: TREND_COLORS[i % TREND_COLORS.length] }]} />
                <Text style={s.legendName} numberOfLines={1}>{key}</Text>
                {change != null && (
                  <Text style={[s.legendPct, { color: isUp ? D.red : D.green }]}>
                    {isUp ? '+' : ''}{change.pct}%
                  </Text>
                )}
              </View>
            )
          })}
        </View>
      </View>

      {/* ── 5. District Comparison ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>District Comparison</Text>
          <Pressable onPress={() => setShowCompare(true)} accessibilityRole="button">
            <Text style={s.cmpPickerBtn}>vs {cmpLabel} ▾</Text>
          </Pressable>
        </View>
        <Text style={s.cardSub2}>{period === 'month' ? 'This Month' : 'This Year'}</Text>

        {([
          {
            label:    'Resolution Rate',
            myVal:    myMetrics  ? `${myMetrics.resolutionRate}%`   : '—',
            cmpVal:   cmpMetrics ? `${cmpMetrics.resolutionRate}%`  : '—',
            myColor:  myMetrics  ? rateColor(myMetrics.resolutionRate)  : D.text3,
            cmpColor: cmpMetrics ? rateColor(cmpMetrics.resolutionRate) : D.text3,
            myFrac:   (myMetrics?.resolutionRate  ?? 0) / 100,
            cmpFrac:  (cmpMetrics?.resolutionRate ?? 0) / 100,
          },
          {
            label:    'Avg Fix Time',
            myVal:    myMetrics?.avgFixTimeHours   != null ? fmtFixTime(myMetrics.avgFixTimeHours)   : 'N/A',
            cmpVal:   cmpMetrics?.avgFixTimeHours  != null ? fmtFixTime(cmpMetrics.avgFixTimeHours)  : 'N/A',
            myColor:  myMetrics?.avgFixTimeHours   != null ? fixTimeColor(myMetrics.avgFixTimeHours)  : D.text3,
            cmpColor: cmpMetrics?.avgFixTimeHours  != null ? fixTimeColor(cmpMetrics.avgFixTimeHours) : D.text3,
            myFrac:   myMetrics?.avgFixTimeHours   != null ? Math.min(1, myMetrics.avgFixTimeHours   / 336) : 0,
            cmpFrac:  cmpMetrics?.avgFixTimeHours  != null ? Math.min(1, cmpMetrics.avgFixTimeHours  / 336) : 0,
          },
          (() => {
            const myR  = myMetrics?.totalReports  ?? 0
            const cmpR = cmpMetrics?.totalReports ?? 0
            const mx   = Math.max(myR, cmpR, 1)
            return {
              label:    'Total Reports',
              myVal:    myMetrics  ? myR.toLocaleString()  : '—',
              cmpVal:   cmpMetrics ? cmpR.toLocaleString() : '—',
              myColor:  D.accent,
              cmpColor: D.text2,
              myFrac:   myR  / mx,
              cmpFrac:  cmpR / mx,
            }
          })(),
        ] as const).map(row => (
          <View key={row.label} style={s.cmpBlock}>
            <Text style={s.cmpBlockLabel}>{row.label}</Text>
            <View style={s.cmpBarRow}>
              <Text style={s.cmpBarTag}>D{district}</Text>
              <View style={s.cmpBarTrack}>
                <View style={[s.cmpBarFill, { width: `${row.myFrac * 100}%` as any, backgroundColor: row.myColor }]} />
              </View>
              <Text style={[s.cmpBarVal, { color: row.myColor }]}>{row.myVal}</Text>
            </View>
            <View style={s.cmpBarRow}>
              <Text style={s.cmpBarTag}>{cmpLabel}</Text>
              <View style={s.cmpBarTrack}>
                <View style={[s.cmpBarFill, { width: `${row.cmpFrac * 100}%` as any, backgroundColor: row.cmpColor }]} />
              </View>
              <Text style={[s.cmpBarVal, { color: row.cmpColor }]}>{row.cmpVal}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── 6. Recurring Issues ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Recurring Issues</Text>
          <Text style={s.cardSub}>Since {meta.currentYear - 9}</Text>
        </View>
        <View style={s.segRow}>
          {([['volume', 'By Volume'], ['type', 'By Type']] as [RecurView, string][]).map(([k, lbl]) => (
            <Pressable
              key={k}
              style={[s.seg, recurView === k && s.segActive]}
              onPress={() => setRecurView(k)}
              accessibilityRole="button"
            >
              <Text style={[s.segText, recurView === k && s.segTextActive]}>{lbl}</Text>
            </Pressable>
          ))}
        </View>

        {recurView === 'volume' ? (
          recurIssues.slice(0, 3).map(spot => (
            <Pressable
              key={`${spot.location}:${spot.issueType}`}
              style={s.recurCard}
              onPress={() => onViewChronicSpot?.(spot)}
              accessibilityRole="button"
            >
              <View style={[s.recurIconBox, { backgroundColor: spot.iconBg }]}>
                <Text style={s.recurIconText}>{spot.icon}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.recurType}>{spot.issueType}</Text>
                <Text style={s.recurLoc}>{spot.location}</Text>
                <Text style={s.recurMeta}>
                  {spot.count.toLocaleString()} reports · {spot.reopenCount} recurrences since {spot.since}
                </Text>
              </View>
              <Text style={s.recurChevron}>›</Text>
            </Pressable>
          ))
        ) : (
          typeKeys.map((type, ti) => {
            const spots  = recurByType[type]
            const isOpen = openTypeKey === type
            return (
              <View key={type}>
                {ti > 0 && <View style={s.rowDivider} />}
                <Pressable
                  style={s.accordionHdr}
                  onPress={() => setOpenType(isOpen ? null : type)}
                  accessibilityRole="button"
                >
                  <Text style={s.accordionIcon}>{CAT_ICON[type] ?? '📋'}</Text>
                  <Text style={s.accordionTitle}>{type}</Text>
                  <Text style={s.accordionCount}>{spots.length} recurring spots</Text>
                  <Text style={s.accordionChev}>{isOpen ? '∧' : '∨'}</Text>
                </Pressable>
                {isOpen && [...spots].sort((a, b) => b.count - a.count).map(spot => (
                  <Pressable
                    key={`${spot.location}:${spot.issueType}`}
                    style={s.accordionItem}
                    onPress={() => onViewChronicSpot?.(spot)}
                    accessibilityRole="button"
                  >
                    <Text style={s.accItemLoc} numberOfLines={1}>{spot.location}</Text>
                    <Text style={s.accItemMeta}>{spot.count.toLocaleString()} reports · {spot.reopenCount} rec</Text>
                    <Text style={s.recurChevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            )
          })
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:       { paddingHorizontal: 16, paddingTop: 16 },
  emptyText:    { color: D.text2, fontSize: 13 },

  // ── District header
  distHeader:   { marginBottom: 20 },
  distEyebrow:  { color: D.text3, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  distName:     { color: D.text1, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 14 },

  // ── Period pills
  pillRow:       { flexDirection: 'row', gap: 8 },
  pill:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: D.border },
  pillActive:    { backgroundColor: D.text1, borderColor: D.text1 },
  pillText:      { color: D.text2, fontSize: 13, fontWeight: '600' },
  pillTextActive:{ color: D.bg },

  // ── Card
  card:       { backgroundColor: D.surface, borderRadius: 14, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle:  { color: D.text1, fontSize: 16, fontWeight: '700' },
  cardSub:    { color: D.text3, fontSize: 12, fontWeight: '500' },
  cardSub2:   { color: D.text3, fontSize: 11, marginBottom: 12, marginTop: -8 },

  // ── Segmented control
  segRow:         { flexDirection: 'row', backgroundColor: D.surfaceHigh, borderRadius: 10, padding: 3, gap: 2, marginBottom: 14 },
  seg:            { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  segActive:      { backgroundColor: D.surface },
  segText:        { color: D.text3, fontSize: 12, fontWeight: '600' },
  segTextActive:  { color: D.text1 },

  // ── Category bars
  barRow:        { marginBottom: 14 },
  barTopRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  barIcon:       { fontSize: 14, width: 20, textAlign: 'center' },
  barName:       { flex: 1, color: D.text1, fontSize: 13, fontWeight: '500' },
  barTrack:      { height: 10, backgroundColor: D.surfaceHigh, borderRadius: 6, overflow: 'hidden' },
  barFill:       { height: 10, borderRadius: 6 },
  barVal:        { fontSize: 12, fontWeight: '500', color: D.text2 },
  legendNote:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  legendNoteItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendNoteBox:  { width: 9, height: 9, borderRadius: 3 },
  legendNoteText: { color: D.text3, fontSize: 11 },

  // ── Top issues
  topRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  topRowBorder: { borderBottomWidth: 1, borderBottomColor: D.border },
  topRank:      { color: D.text3, fontSize: 13, fontWeight: '700', width: 26 },
  topIcon:      { fontSize: 18, width: 26, textAlign: 'center' },
  topName:      { flex: 1, color: D.text1, fontSize: 14, fontWeight: '600' },
  topCount:     { color: D.text2, fontSize: 13, fontWeight: '600' },

  // ── Trend chart
  miniSegRow:        { flexDirection: 'row', gap: 6 },
  miniSeg:           { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: D.border },
  miniSegActive:     { backgroundColor: D.text1, borderColor: D.text1 },
  miniSegText:       { color: D.text2, fontSize: 11, fontWeight: '600' },
  miniSegTextActive: { color: D.bg },
  axisLabel:         { color: D.text3, fontSize: 10 },

  // ── Trend legend
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '46%' },
  legendDot:  { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendName: { flex: 1, color: D.text2, fontSize: 11 },
  legendPct:  { fontSize: 11, fontWeight: '700' },

  // ── District comparison
  cmpPickerBtn:  { color: D.accent, fontSize: 13, fontWeight: '600' },
  cmpBlock:      { marginBottom: 16 },
  cmpBlockLabel: { color: D.text3, fontSize: 11, fontWeight: '600', letterSpacing: 0.3, marginBottom: 8, textTransform: 'uppercase' },
  cmpBarRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cmpBarTag:     { width: 44, color: D.text2, fontSize: 11, fontWeight: '600' },
  cmpBarTrack:   { flex: 1, height: 8, backgroundColor: D.surfaceHigh, borderRadius: 4, overflow: 'hidden' },
  cmpBarFill:    { height: 8, borderRadius: 4 },
  cmpBarVal:     { width: 60, textAlign: 'right', fontSize: 12, fontWeight: '700' },

  // ── Recurring
  recurCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: D.border },
  recurIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recurIconText:{ fontSize: 20 },
  recurType:    { color: D.text1, fontSize: 14, fontWeight: '700' },
  recurLoc:     { color: D.text2, fontSize: 12 },
  recurMeta:    { color: D.text3, fontSize: 11 },
  recurChevron: { color: D.text3, fontSize: 22, fontWeight: '300', flexShrink: 0 },

  // ── Accordion (by type)
  rowDivider:     { height: 1, backgroundColor: D.border },
  accordionHdr:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  accordionIcon:  { fontSize: 18, width: 26, textAlign: 'center' },
  accordionTitle: { flex: 1, color: D.text1, fontSize: 14, fontWeight: '600' },
  accordionCount: { color: D.text3, fontSize: 12, fontWeight: '600' },
  accordionChev:  { color: D.text3, fontSize: 13, fontWeight: '700', width: 16, textAlign: 'center' },
  accordionItem:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingLeft: 36, paddingRight: 14, gap: 10, borderTopWidth: 1, borderTopColor: D.border },
  accItemLoc:     { flex: 1, color: D.text1, fontSize: 13 },
  accItemMeta:    { color: D.text2, fontSize: 11, flexShrink: 0 },

  // ── Compare picker modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: D.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, maxHeight: '72%' },
  modalHandle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: D.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  modalTitle:    { color: D.text2, fontSize: 12, fontWeight: '700', letterSpacing: 1, textAlign: 'center', paddingVertical: 12 },
  cmpRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: D.border },
  cmpRowActive:  { backgroundColor: D.surfaceHigh },
  cmpRowLabel:   { flex: 1, color: D.text2, fontSize: 15, fontWeight: '700' },
  cmpRowSub:     { color: D.text3, fontSize: 12, marginTop: 1 },
  cmpCheck:      { color: D.green, fontSize: 16, fontWeight: '700' },
})
