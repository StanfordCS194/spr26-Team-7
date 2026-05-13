import { useRef, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { DashboardMap } from './DashboardMap'
import { MapReport } from '../data/mockMapReports'
import {
  DISTRICT_NEIGHBORHOODS,
  Period,
  formatCount,
  periodCountLabel,
} from '../data/dashboardMockData'
import { dashboard311, RealIssueType, SummaryCardData, TrendItem, ChronicSpot } from '../data/dashboard311'

type TrendWindow = 'month' | 'year'

// ─── Palette ──────────────────────────────────────────────────────────────────
const D = {
  bg:           '#18191C',
  surface:      '#222428',
  surfaceHigh:  '#2C2D32',
  border:       '#35373D',
  text1:        '#F2F3F5',
  text2:        '#8D939E',
  text3:        '#55595F',
  red:          '#E8514A',
  green:        '#3ECF82',
  amber:        '#F0A030',
} as const

// ─── Sparkline ────────────────────────────────────────────────────────────────
type SparklineProps = { data: number[]; color: string; width?: number; height?: number }

const Sparkline = ({ data, color, width = 88, height = 36 }: SparklineProps) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return (
    <View style={{ width, height, flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
      {data.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: Math.max(3, ((v - min) / range) * (height - 6) + 6),
            backgroundColor: color,
            borderRadius: 1,
            opacity: 0.35 + (i / (data.length - 1)) * 0.65,
          }}
        />
      ))}
    </View>
  )
}

// ─── District picker modal ────────────────────────────────────────────────────
type PickerProps = {
  visible:   boolean
  current:   number
  onSelect:  (d: number) => void
  onClose:   () => void
}

const DistrictPicker = ({ visible, current, onSelect, onClose }: PickerProps) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={s.modalOverlay} onPress={onClose}>
      <View style={s.modalSheet}>
        <View style={s.modalHandle} />
        <Text style={s.modalTitle}>Select District</Text>
        <ScrollView bounces={false}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(d => (
            <Pressable
              key={d}
              style={[s.districtRow, d === current && s.districtRowActive]}
              onPress={() => { onSelect(d); onClose() }}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.districtRowNum, d === current && { color: D.text1 }]}>District {d}</Text>
                <Text style={s.districtRowSub}>{DISTRICT_NEIGHBORHOODS[d]}</Text>
              </View>
              {d === current && <Text style={s.districtCheck}>✓</Text>}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Pressable>
  </Modal>
)

// ─── Avg time label helpers ───────────────────────────────────────────────────
const AVG_EXPLANATIONS = new Set(['Auto-closed by city', 'Not enough data'])
function isAvgExplanation(label: string) { return AVG_EXPLANATIONS.has(label) }

function fmtTimeDelta(deltaDays: number | null): string | null {
  if (deltaDays === null) return null
  const abs = Math.abs(deltaDays)
  const label = abs < 1 ? `${Math.round(abs * 24)}h` : `${Math.round(abs)}d`
  return deltaDays < 0 ? `↓${label}` : `↑${label}`
}

const currentMonthName = 'Apr'
const priorMonthName   = 'Mar'
const currentYear      = 2026
const priorYear        = 2025

function fmtReports(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${Math.round(n / 1000)}K`
  return String(n)
}

// ─── Dashboard screen ─────────────────────────────────────────────────────────
type DashboardScreenProps = {
  onViewReport?:       (report: MapReport)  => void
  onViewChronicSpot?:  (spot: ChronicSpot)  => void
  extraReports?:       MapReport[]
  focusReport?:        MapReport | null
  onFocusConsumed?:    () => void
  reportImages?:       Record<string, import('../types').SampleIssueImage>
}

export const DashboardScreen = ({ onViewReport, onViewChronicSpot, extraReports, focusReport, onFocusConsumed, reportImages }: DashboardScreenProps) => {
  const [district,      setDistrict]      = useState(3)
  const [period,        setPeriod]        = useState<Period>('month')
  const [trendWindow,   setTrendWindow]   = useState<TrendWindow>('month')
  const [showAllIssues, setShowAllIssues] = useState(false)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [activeTab,     setActiveTab]     = useState<'map' | 'insights'>('map')

  const { width: screenWidth } = useWindowDimensions()
  const pagerRef = useRef<ScrollView>(null)

  const districtData = dashboard311.districts[String(district)]
  const { summary }  = districtData.byPeriod[period]
  const {
    issueTypes,
    chronicSpots,
    sparklineRate,
    sparklineAvgDays,
    monthlyRate,
    monthlyAvgDays,
    volumeByYear,
    totalReports,
    trendsVsMonth,
    trendsVsYear,
  } = districtData

  const sortedIssues   = [...issueTypes].sort((a, b) => b.countByPeriod[period] - a.countByPeriod[period])
  const visibleIssues  = showAllIssues ? sortedIssues : sortedIssues.slice(0, 3)
  const activeTrends: TrendItem[] = trendWindow === 'month' ? trendsVsMonth : trendsVsYear

  const handlePeriodChange = (p: Period) => {
    setPeriod(p)
    setShowAllIssues(false)
  }

  const handleDistrictChange = (d: number) => {
    setDistrict(d)
    setPeriod('month')
    setShowAllIssues(false)
  }

  const switchTab = (tab: 'map' | 'insights') => {
    pagerRef.current?.scrollTo({ x: tab === 'map' ? 0 : screenWidth, animated: true })
    setActiveTab(tab)
  }

  // Avg fix time sparkline: period-aware; replace null with 0 for display; invert sentiment (lower = better)
  const activeAvgDays  = period === 'month' ? monthlyAvgDays : sparklineAvgDays
  const avgDaysData    = activeAvgDays.map(v => v ?? 0)
  const nonNullDays    = activeAvgDays.filter((v): v is number => v !== null)
  const avgDaysTrendUp = nonNullDays.length >= 2 && nonNullDays[nonNullDays.length - 1] > nonNullDays[0]
  const avgDaysColor   = avgDaysTrendUp ? D.red : D.green

  // District comparison — YTD resolution rate for all 10 districts, sorted ascending for dot scale
  const compRatesAsc = Array.from({ length: 10 }, (_, i) => ({
    d: i + 1,
    rate: dashboard311.districts[String(i + 1)].byPeriod.year.summary.resolutionRate,
  })).sort((a, b) => a.rate - b.rate)
  const distYTDRate  = compRatesAsc.find(x => x.d === district)?.rate ?? 0
  const distRank     = 10 - compRatesAsc.findIndex(x => x.d === district)

  return (
    <View style={s.page}>
      <DistrictPicker
        visible={pickerVisible}
        current={district}
        onSelect={handleDistrictChange}
        onClose={() => setPickerVisible(false)}
      />

      {/* ── Fixed header (shared across both tabs) ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerEyebrow}>YOUR NEIGHBORHOOD</Text>
          <Pressable
            style={s.headerRow}
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Change district"
          >
            <Text style={s.headerNeighborhood}>District {district}</Text>
            <Text style={s.headerChevron}>  ▾</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Tab bar ── */}
      <View style={s.tabBar}>
        {(['map', 'insights'] as const).map(tab => (
          <Pressable
            key={tab}
            style={s.tabItem}
            onPress={() => switchTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>
              {tab === 'map' ? 'Map' : 'Insights'}
            </Text>
            {activeTab === tab && <View style={s.tabIndicator} />}
          </Pressable>
        ))}
      </View>

      {/* ── Horizontal pager ── */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e => {
          const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth)
          setActiveTab(page === 0 ? 'map' : 'insights')
        }}
        style={{ flex: 1 }}
      >

        {/* ── Tab 1: Map ── */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <DashboardMap
            district={district}
            onViewReport={onViewReport ?? (() => {})}
            extraReports={extraReports}
            focusReport={focusReport}
            onFocusConsumed={onFocusConsumed}
            reportImages={reportImages}
          />
        </View>

        {/* ── Tab 2: Insights ── */}
        <View style={{ width: screenWidth }}>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            {/* ── 1. Citywide resolution rate ── */}
            <View style={s.citywideCard}>
              <View style={s.citywideTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.citywideLabel}>Citywide Resolution Rate</Text>
                  <View style={s.citywideTrajectory}>
                    <Text style={s.citywideStart}>96%</Text>
                    <Text style={s.citywideArrow}> → </Text>
                    <Text style={s.citywideEnd}>86%</Text>
                  </View>
                  <Text style={s.citywideSub}>since 2017</Text>
                </View>
                <View style={{ width: 100, gap: 4 }}>
                  <Sparkline data={dashboard311.citywide.resolutionByYear} color={D.red} width={100} height={48} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={s.sparkYear}>2017</Text>
                    <Text style={s.sparkYear}>2026</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── 2. District heading ── */}
            <Text style={[s.sectionTitle, { marginBottom: 12, marginTop: 24 }]}>District {district} Insights</Text>

            {/* ── 3. District comparison (static — YTD, not affected by toggle) ── */}
            <View style={s.distCompCard}>
              <View style={s.distCompHeader}>
                <Text style={s.distCompLabel}>District Comparison</Text>
                <Text style={s.distCompSub}>Resolution Rate · YTD 2026</Text>
              </View>
              <View style={s.dotScaleRow}>
                {compRatesAsc.map(item => {
                  const isCurrent = item.d === district
                  return (
                    <View key={item.d} style={s.dotCell}>
                      <Text style={s.dotCellLabel}>{isCurrent ? `D${item.d}` : ''}</Text>
                      <View style={[s.dot, isCurrent ? s.dotCurrent : s.dotOther]} />
                    </View>
                  )
                })}
              </View>
              <View style={s.dotScaleEnds}>
                <Text style={s.dotEndText}>{compRatesAsc[0].rate}%</Text>
                <Text style={s.dotEndText}>{compRatesAsc[9].rate}%</Text>
              </View>
              <Text style={s.distRankText}>
                District {district} ranks{' '}
                <Text style={s.distRankHighlight}>#{distRank} of 10</Text>
                {' '}({distYTDRate}%)
              </Text>
            </View>

            {/* ── 4. Period toggle ── */}
            <View style={s.pillRow}>
              {([
                ['month', 'This Month'],
                ['year',  'This Year'],
                ['all',   'All Time'],
              ] as [Period, string][]).map(([key, label]) => (
                <Pressable
                  key={key}
                  style={[s.pill, period === key && s.pillActive]}
                  onPress={() => handlePeriodChange(key)}
                  accessibilityRole="button"
                >
                  <Text style={[s.pillText, period === key && s.pillTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── 4. Summary cards ── */}
            <View style={s.summaryRow}>

              {/* Resolution Rate */}
              <View style={s.summaryCard}>
                <Text style={s.summaryLabel}>Resolution Rate</Text>
                <Text style={s.summaryValue}>{summary.resolutionRate}%</Text>
                {period !== 'all' && summary.resolutionRateDelta !== 0 && (
                  <Text style={[s.summaryDelta, { color: summary.resolutionRateDelta > 0 ? D.green : D.red }]}>
                    {summary.resolutionRateDelta > 0 ? '↑' : '↓'}{Math.abs(summary.resolutionRateDelta)}%
                    {' '}{period === 'month' ? `vs ${priorMonthName}` : `vs ${priorYear}`}
                  </Text>
                )}
                <Sparkline
                  data={period === 'month' ? monthlyRate : sparklineRate}
                  color={D.green}
                  width={128}
                  height={40}
                />
                <View style={s.sparkYears}>
                  <Text style={s.sparkYear}>{period === 'month' ? 'Jan' : '2017'}</Text>
                  <Text style={s.sparkYear}>{period === 'month' ? currentMonthName : '2026'}</Text>
                </View>
              </View>

              {/* Right card: Total Reports (All Time) or Avg Fix Time (month/year) */}
              {period === 'all' ? (
                <View style={s.summaryCard}>
                  <Text style={s.summaryLabel}>Total Reports</Text>
                  <View style={s.summaryValueRow}>
                    <Text style={s.summaryValue}>{fmtReports(totalReports)}</Text>
                  </View>
                  <Sparkline data={volumeByYear} color={D.amber} width={128} height={40} />
                  <View style={s.sparkYears}>
                    <Text style={s.sparkYear}>2017</Text>
                    <Text style={s.sparkYear}>2026</Text>
                  </View>
                </View>
              ) : (
                <View style={s.summaryCard}>
                  <Text style={s.summaryLabel}>Avg Fix Time</Text>
                  {isAvgExplanation(summary.avgFixTimeLabel) ? (
                    <Text style={s.avgExplanation}>{summary.avgFixTimeLabel}</Text>
                  ) : (
                    <>
                      <Text style={s.summaryValue}>{summary.avgFixTimeLabel}</Text>
                      {summary.avgFixTimeDelta !== null && summary.avgFixTimeDelta !== 0 && (
                        <Text style={[s.summaryDelta, { color: summary.avgFixTimeDelta < 0 ? D.green : D.red }]}>
                          {fmtTimeDelta(summary.avgFixTimeDelta)}
                          {' '}{period === 'month' ? `vs ${priorMonthName}` : `vs ${priorYear}`}
                        </Text>
                      )}
                    </>
                  )}
                  <Sparkline data={avgDaysData} color={avgDaysColor} width={128} height={40} />
                  <View style={s.sparkYears}>
                    <Text style={s.sparkYear}>{period === 'month' ? 'Jan' : '2017'}</Text>
                    <Text style={s.sparkYear}>{period === 'month' ? currentMonthName : '2026'}</Text>
                  </View>
                </View>
              )}

            </View>

            {/* ── 5. By issue type ── */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>By Issue Type</Text>
              <Text style={s.sectionSub}>
                {period === 'month' ? 'This Month' : period === 'year' ? 'This Year' : 'All Time'}
              </Text>
            </View>

            {visibleIssues.map((item: RealIssueType) => {
              const { resolvedPct, avgTimeLabel } = item[period]
              const rateColor    = resolvedPct >= 85 ? D.green : resolvedPct >= 60 ? D.amber : D.red
              const sparkData    = period === 'month' ? item.monthlySparkline : item.sparkline
              const sparkTrendUp = sparkData[sparkData.length - 1] > sparkData[0]
              const sparkColor   = sparkTrendUp ? D.red : D.green
              const count        = formatCount(item.countByPeriod[period], period)
              const cLabel       = periodCountLabel(period)
              return (
                <Pressable key={item.id} style={s.issueCard} accessibilityRole="button">
                  <View style={s.issueTop}>
                    <View style={[s.issueIconBox, { backgroundColor: item.iconBg }]}>
                      <Text style={s.issueIcon}>{item.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.issueName}>{item.name}</Text>
                      <Text style={s.issueCount}>{count} {cLabel}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Sparkline data={sparkData} color={sparkColor} width={72} height={28} />
                      <Text style={s.sparkTrendLabel}>Volume</Text>
                    </View>
                  </View>

                  <View style={s.issueDivider} />

                  <View style={s.issueStats}>
                    <View style={s.issueStat}>
                      <Text style={s.issueStatLabel}>Resolved</Text>
                      <Text style={[s.issueStatValue, { color: rateColor }]}>{resolvedPct}%</Text>
                    </View>
                    <View style={s.issueStat}>
                      <Text style={s.issueStatLabel}>Avg Time</Text>
                      {isAvgExplanation(avgTimeLabel) ? (
                        <Text style={s.avgExplanation}>{avgTimeLabel}</Text>
                      ) : (
                        <Text style={s.issueStatValue}>{avgTimeLabel}</Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              )
            })}

            {sortedIssues.length > 3 && (
              <Pressable style={s.seeAllBtn} onPress={() => setShowAllIssues(v => !v)} accessibilityRole="button">
                <Text style={s.seeAllText}>
                  {showAllIssues ? 'Show Less  ∧' : 'See All Categories  ∨'}
                </Text>
              </Pressable>
            )}

            {/* ── Group 3 divider — toggle stops here ── */}
            <View style={s.groupDivider} />

            {/* ── 6. Trends ── */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Trends</Text>
              <View style={s.trendToggleRow}>
                {([
                  ['month', 'vs Last Month'],
                  ['year',  'vs Last Year'],
                ] as [TrendWindow, string][]).map(([key, label]) => (
                  <Pressable
                    key={key}
                    style={[s.trendPill, trendWindow === key && s.trendPillActive]}
                    onPress={() => setTrendWindow(key)}
                    accessibilityRole="button"
                  >
                    <Text style={[s.trendPillText, trendWindow === key && s.trendPillTextActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {activeTrends.length > 0 ? (
              <View style={s.listCard}>
                {activeTrends.map((t: TrendItem, i) => {
                  const isUp   = t.pct > 0
                  const isLast = i === activeTrends.length - 1
                  return (
                    <View key={t.name}>
                      <View style={s.trendRow}>
                        <Text style={[s.trendArrow, { color: isUp ? D.red : D.green }]}>
                          {isUp ? '↑' : '↓'}
                        </Text>
                        <Text style={s.trendName}>{t.name}</Text>
                        <Text style={[s.trendPct, { color: isUp ? D.red : D.green }]}>
                          {isUp ? '+' : ''}{t.pct}%
                        </Text>
                      </View>
                      {!isLast && <View style={s.rowDivider} />}
                    </View>
                  )
                })}
              </View>
            ) : (
              <View style={[s.listCard, { padding: 16 }]}>
                <Text style={{ color: D.text2, fontSize: 13 }}>No significant changes this period.</Text>
              </View>
            )}

            {/* ── 7. Recurring issues ── */}
            <View style={s.groupDivider} />
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recurring Issues</Text>
              <Text style={s.sectionSub}>Since 2017</Text>
            </View>

            {chronicSpots.map(spot => {
              const showEveryYear = spot.maxConsecYears >= 8
              return (
                <View key={`${spot.location}:${spot.issueType}`} style={s.chronicCard}>
                  <View style={[s.issueIconBox, { backgroundColor: spot.iconBg, alignSelf: 'flex-start' }]}>
                    <Text style={s.issueIcon}>{spot.icon}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.chronicIssueType}>{spot.issueType}</Text>
                    <Text style={s.chronicLocation}>{spot.location}</Text>
                    <Text style={s.chronicMeta}>{spot.count.toLocaleString()} reports since {spot.since}</Text>
                    {showEveryYear && (
                      <View style={s.everyYearBadge}>
                        <Text style={s.everyYearText}>Reported Every Year since {spot.since}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )
            })}

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>

      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  // ── Header
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerEyebrow:      { color: D.text2, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  headerRow:          { flexDirection: 'row', alignItems: 'baseline' },
  headerNeighborhood: { color: D.text1, fontSize: 26, fontWeight: '800' },
  headerChevron:      { color: D.text2, fontSize: 18, fontWeight: '600' },

  // ── Tab bar
  tabBar:          { flexDirection: 'row', backgroundColor: D.bg, borderBottomWidth: 1, borderBottomColor: D.border },
  tabItem:         { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabLabel:        { fontSize: 14, fontWeight: '600', color: D.text2 },
  tabLabelActive:  { color: D.text1 },
  tabIndicator:    { position: 'absolute', bottom: 0, left: 20, right: 20, height: 2, backgroundColor: D.text1, borderRadius: 1 },

  // ── Section chrome
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:  { color: D.text1, fontSize: 18, fontWeight: '800' },
  sectionSub:    { color: D.text1, fontSize: 13, fontWeight: '600' },

  // ── Period pill toggle
  pillRow:         { flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'center' },
  pill:            { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: D.border },
  pillActive:      { backgroundColor: D.text1, borderColor: D.text1 },
  pillText:        { color: D.text2, fontSize: 13, fontWeight: '600' },
  pillTextActive:  { color: D.bg },

  // ── Citywide callout
  citywideCard:       { backgroundColor: 'rgba(91,155,248,0.07)', borderLeftWidth: 3, borderLeftColor: '#5B9BF8', borderTopRightRadius: 8, borderBottomRightRadius: 8, padding: 14, marginBottom: 16 },
  citywideTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  citywideLabel:      { color: D.text2, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  citywideTrajectory: { flexDirection: 'row', alignItems: 'baseline' },
  citywideStart:      { color: D.green, fontSize: 24, fontWeight: '800' },
  citywideArrow:      { color: D.text2, fontSize: 18, fontWeight: '400' },
  citywideEnd:        { color: D.red,   fontSize: 24, fontWeight: '800' },
  citywideSub:        { color: D.text2, fontSize: 11, marginTop: 4 },

  // ── Summary cards
  summaryRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard:     { flex: 1, backgroundColor: D.surface, borderRadius: 14, padding: 12, gap: 4 },
  summaryLabel:    { color: D.text2, fontSize: 12, fontWeight: '600' },
  summaryValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  summaryValue:    { color: D.text1, fontSize: 22, fontWeight: '800' },
  summaryDelta:    { fontSize: 13, fontWeight: '700' },
  sparkYears:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, width: '100%' },
  sparkYear:       { color: D.text2, fontSize: 10 },

  // ── District comparison card
  distCompCard:    { backgroundColor: D.surface, borderRadius: 14, padding: 14, marginBottom: 24 },
  distCompHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  distCompLabel:   { color: D.text2, fontSize: 12, fontWeight: '600' },
  distCompSub:     { color: D.text3, fontSize: 11 },
  dotScaleRow:     { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 3 },
  dotCell:         { flex: 1, alignItems: 'center' },
  dotCellLabel:    { color: D.text1, fontSize: 9, fontWeight: '700', height: 13, textAlign: 'center' },
  dot:             { borderRadius: 99 },
  dotCurrent:      { width: 12, height: 12, backgroundColor: D.green },
  dotOther:        { width: 7, height: 7, backgroundColor: D.border },
  dotScaleEnds:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dotEndText:      { color: D.text3, fontSize: 10 },
  distRankText:    { color: D.text2, fontSize: 13 },
  distRankHighlight: { color: D.text1, fontWeight: '700' },

  // ── Group divider
  groupDivider:    { height: 1, backgroundColor: D.border, marginTop: 20, marginBottom: 20 },

  // ── Issue type cards
  issueCard:       { backgroundColor: D.surface, borderRadius: 14, padding: 14, marginBottom: 10 },
  issueTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  issueIconBox:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  issueIcon:       { fontSize: 22 },
  issueName:       { color: D.text1, fontSize: 15, fontWeight: '700' },
  issueCount:      { color: D.text2, fontSize: 12, marginTop: 2 },
  sparkTrendLabel: { color: D.text2, fontSize: 10 },
  peakLabel:       { color: D.text2, fontSize: 10 },
  issueDivider:    { height: 1, backgroundColor: D.border, marginVertical: 10 },
  issueStats:      { flexDirection: 'row' },
  issueStat:       { flex: 1 },
  issueStatLabel:  { color: D.text2, fontSize: 10, fontWeight: '600', marginBottom: 3 },
  issueStatValue:  { color: D.text1, fontSize: 14, fontWeight: '700' },
  avgExplanation:  { color: D.text2, fontSize: 11, fontWeight: '500', marginTop: 2 },

  seeAllBtn:  { alignItems: 'center', paddingVertical: 14, marginBottom: 4 },
  seeAllText: { color: D.text2, fontSize: 14, fontWeight: '600' },

  // ── Shared list card
  listCard:   { backgroundColor: D.surface, borderRadius: 14, overflow: 'hidden', marginBottom: 4 },
  rowDivider: { height: 1, backgroundColor: D.border, marginHorizontal: 14 },

  // ── Chronic spots
  chronicCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: D.surface, borderRadius: 14, padding: 14, marginBottom: 10 },
  chronicIssueType:{ color: D.text1, fontSize: 15, fontWeight: '700' },
  chronicLocation: { color: D.text2, fontSize: 12 },
  chronicMeta:     { color: D.text2, fontSize: 12 },
  everyYearBadge:  { marginTop: 4, alignSelf: 'flex-start', backgroundColor: D.surfaceHigh, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  everyYearText:   { color: D.text2, fontSize: 10, fontWeight: '600' },
  chronicChevron:  { color: D.text3, fontSize: 22, fontWeight: '300', flexShrink: 0 },

  // ── Trends
  trendToggleRow:      { flexDirection: 'row', gap: 6 },
  trendPill:           { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: D.border },
  trendPillActive:     { backgroundColor: D.text1, borderColor: D.text1 },
  trendPillText:       { color: D.text2, fontSize: 12, fontWeight: '600' },
  trendPillTextActive: { color: D.bg },
  trendRow:            { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  trendArrow:          { fontSize: 16, fontWeight: '800', width: 18 },
  trendName:           { flex: 1, color: D.text1, fontSize: 14, fontWeight: '600' },
  trendPct:            { fontSize: 14, fontWeight: '800' },

  // ── District picker modal
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet:         { backgroundColor: D.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, maxHeight: '72%' },
  modalHandle:        { width: 36, height: 4, borderRadius: 2, backgroundColor: D.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  modalTitle:         { color: D.text2, fontSize: 12, fontWeight: '700', letterSpacing: 1, textAlign: 'center', paddingVertical: 12 },
  districtRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: D.border },
  districtRowActive:  { backgroundColor: D.surfaceHigh },
  districtRowNum:     { color: D.text2, fontSize: 15, fontWeight: '700' },
  districtRowSub:     { color: D.text3, fontSize: 12, marginTop: 1 },
  districtCheck:      { color: D.green, fontSize: 16, fontWeight: '700' },
})
