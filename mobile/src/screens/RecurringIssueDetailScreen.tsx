import { useMemo } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native'
import { ChronicSpotV2 } from '../data/dashboard311v2'

type Props = {
  spot:   ChronicSpotV2
  onBack: () => void
}

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

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const ALL_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
const CHART_H = 90

function fmtReturnTime(days: number): string {
  if (days < 7)  return `~${Math.round(days)} days`
  if (days < 30) return `~${Math.round(days / 7)} wk`
  return `~${Math.round(days / 30)} mo`
}

function fmtDays(days: number): string {
  if (days < 1 / 24) return '< 1 hr'
  if (days < 2) {
    const hrs = Math.round(days * 24)
    return hrs === 1 ? '1 hr' : `${hrs} hrs`
  }
  return `${Math.round(days)} days`
}

function fmtDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

export const RecurringIssueDetailScreen = ({ spot, onBack }: Props) => {
  const showEveryYear = spot.maxConsecYears >= 8

  // Sort ascending to handle known date-inversion issue from build script
  const sortedEvents = useMemo(
    () => [...spot.timelineEvents].sort((a, b) => a.date.localeCompare(b.date)),
    [spot.timelineEvents],
  )

  // Count 'reported' events (new incident after resolved previous) by year
  const recurrencesByYear = useMemo(() => {
    const byYear: Record<number, number> = {}
    for (const ev of sortedEvents) {
      if (ev.eventType === 'reported') {
        const y = Number(ev.date.split('-')[0])
        byYear[y] = (byYear[y] ?? 0) + 1
      }
    }
    return byYear
  }, [sortedEvents])

  const maxCount = Math.max(...ALL_YEARS.map(y => recurrencesByYear[y] ?? 0), 1)

  // Show newest-first
  const sortedActivity = useMemo(
    () => [...spot.recentActivity].sort((a, b) => b.date.localeCompare(a.date)),
    [spot.recentActivity],
  )

  return (
    <View style={s.page}>

      <Pressable style={s.backRow} onPress={onBack} accessibilityRole="button">
        <Text style={s.backArrow}>‹</Text>
        <Text style={s.backLabel}>Recurring Issues</Text>
      </Pressable>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Title */}
        <View style={s.titleCard}>
          <View style={s.titleRow}>
            <View style={[s.iconBox, { backgroundColor: spot.iconBg }]}>
              <Text style={s.iconText}>{spot.icon}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.titleText}>{spot.issueType}</Text>
              <Text style={s.locationText}>{spot.location}</Text>
              {showEveryYear && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>↻ Reported Every Year since {spot.since}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {([
            { label: 'Total Reports',  value: spot.count.toLocaleString() },
            { label: 'Recurrences',    value: String(spot.reopenCount) },
            { label: 'Returns Within', value: spot.returnMedianDays !== null ? fmtReturnTime(spot.returnMedianDays) : '—' },
          ] as const).map(({ label, value }) => (
            <View key={label} style={s.statCard}>
              <Text style={s.statLabel}>{label}</Text>
              <Text style={[s.statValue, value === '—' && { color: D.text2 }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Recurrences by year bar chart */}
        <View style={s.sectionCard}>
          <Text style={s.secLabel}>Recurrences by Year</Text>
          <View style={s.barChart}>
            {ALL_YEARS.map(y => {
              const count    = recurrencesByYear[y] ?? 0
              const barH     = count === 0 ? 3 : Math.max(4, Math.round((count / maxCount) * CHART_H))
              const barColor = count === 0 ? D.border : D.accent
              return (
                <View key={y} style={s.barCol}>
                  <Text style={s.barVal}>{count > 0 ? count : ''}</Text>
                  <View style={[s.bar, { height: barH, backgroundColor: barColor }]} />
                  <Text style={s.barYr}>{`'${String(y).slice(2)}`}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Recent activity */}
        <View style={s.sectionCard}>
          <Text style={s.secLabel}>Recent Activity</Text>
          {sortedActivity.length === 0 ? (
            <Text style={[s.emptyText, { marginTop: 10 }]}>No recent activity.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {sortedActivity.map((record, i) => {
                const isLast     = i === sortedActivity.length - 1
                const stColor    = record.status === 'Closed'      ? D.green
                                 : record.status === 'In Progress' ? D.amber
                                 : D.red
                const resolution = record.status === 'Closed'
                  ? (record.resolutionDays !== null ? fmtDays(record.resolutionDays) : '—')
                  : 'Pending'
                return (
                  <View key={i}>
                    <View style={s.activityRow}>
                      <Text style={s.activityDate}>{fmtDate(record.date)}</Text>
                      <View style={[s.statusBadge, { backgroundColor: stColor + '28' }]}>
                        <Text style={[s.statusText, { color: stColor }]}>{record.status}</Text>
                      </View>
                      <Text style={[s.activityRes, record.status !== 'Closed' && s.activityResPending]}>
                        {resolution}
                      </Text>
                    </View>
                    {!isLast && <View style={s.rowDivider} />}
                  </View>
                )
              })}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },

  backRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12 },
  backArrow: { color: D.accent, fontSize: 26, fontWeight: '300', lineHeight: 30 },
  backLabel: { color: D.accent, fontSize: 14, fontWeight: '500' },

  titleCard:    { backgroundColor: D.surface, borderRadius: 14, padding: 16, marginBottom: 12 },
  titleRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox:      { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconText:     { fontSize: 24 },
  titleText:    { color: D.text1, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  locationText: { color: D.text3, fontSize: 13, marginTop: 4 },
  badge: {
    marginTop: 9, alignSelf: 'flex-start',
    backgroundColor: 'rgba(91,155,248,0.14)',
    borderWidth: 1, borderColor: 'rgba(91,155,248,0.32)',
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4,
  },
  badgeText: { color: '#9ABAF8', fontSize: 10.5, fontWeight: '600', letterSpacing: 0.2 },

  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: D.surface,
    borderWidth: 1, borderColor: D.surfaceHigh,
    borderRadius: 14, padding: 13, gap: 8,
  },
  statLabel: { color: D.text2, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  statValue: { color: D.text1, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },

  sectionCard: { backgroundColor: D.surface, borderRadius: 14, padding: 14, marginBottom: 12 },
  secLabel:    { color: D.text2, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12 },
  emptyText:   { color: D.text2, fontSize: 13 },

  // Bar chart — each column is CHART_H + 13 (label) + 3 (gap) + 3 (gap) + 12 (year) = fixed height
  barChart: { flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: CHART_H + 30 },
  barCol:   { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  barVal:   { color: D.text1, fontSize: 9, fontWeight: '600', height: 12, textAlign: 'center' },
  bar:      { width: '62%', maxWidth: 16, borderRadius: 3 },
  barYr:    { color: D.text3, fontSize: 9 },

  activityRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  activityDate:      { color: D.text1, fontSize: 13.5, fontWeight: '500', flex: 1 },
  statusBadge:       { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  statusText:        { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
  activityRes:       { fontSize: 12.5, color: D.text2, minWidth: 52, textAlign: 'right' },
  activityResPending:{ color: D.text3 },
  rowDivider:        { height: 1, backgroundColor: D.border },
})
