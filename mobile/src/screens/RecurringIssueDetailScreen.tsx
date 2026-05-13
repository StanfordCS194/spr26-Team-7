import { useWindowDimensions, ScrollView, View, Text, Pressable, StyleSheet } from 'react-native'
import { ChronicSpot } from '../data/dashboard311'

type Props = {
  spot:   ChronicSpot
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
} as const

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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

const PX_PER_YEAR   = 120
const TIMELINE_H    = 80
const LINE_Y        = 54
const DOT_R         = 5
const MIN_DOT_GAP   = DOT_R * 2 + 4

export const RecurringIssueDetailScreen = ({ spot, onBack }: Props) => {
  const { width: screenWidth } = useWindowDimensions()
  const showEveryYear = spot.maxConsecYears >= 8
  const since   = spot.since
  const endYear = 2026
  const numYears = endYear - since + 1

  const startMs = new Date(`${since}-01-01T00:00:00`).getTime()
  const totalMs = new Date(`${endYear + 1}-01-01T00:00:00`).getTime() - startMs

  const baseWidth = Math.max(
    PX_PER_YEAR * numYears,
    spot.timelineEvents.length * MIN_DOT_GAP + 40,
    screenWidth - 32,
  )

  // Raw x positions proportional to date
  const rawX = spot.timelineEvents.map(ev => {
    const ms = new Date(ev.date + 'T00:00:00').getTime()
    return ((ms - startMs) / totalMs) * baseWidth
  })

  // Apply minimum gap (forward pass)
  const adjX: number[] = []
  for (let i = 0; i < rawX.length; i++) {
    adjX.push(i === 0 ? rawX[i] : Math.max(rawX[i], adjX[i - 1] + MIN_DOT_GAP))
  }
  const effectiveWidth = Math.max(baseWidth, (adjX[adjX.length - 1] ?? 0) + 20)

  const years = Array.from({ length: numYears }, (_, i) => since + i)

  return (
    <View style={s.page}>

      {/* Back header */}
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
                  <Text style={s.badgeText}>Reported Every Year since {since}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          {([
            { label: 'Total Reports',  value: spot.count.toLocaleString() },
            { label: 'Times Resolved', value: String(spot.reopenCount) },
            { label: 'Returns Within', value: spot.returnMedianDays !== null ? fmtReturnTime(spot.returnMedianDays) : '—' },
          ] as const).map(({ label, value }) => (
            <View key={label} style={s.statCard}>
              <Text style={s.statLabel}>{label}</Text>
              <Text style={[s.statValue, value === '—' && { color: D.text2 }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Recurrence timeline */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Recurrence Timeline</Text>
          {spot.timelineEvents.length === 0 ? (
            <Text style={[s.emptyText, { marginTop: 12 }]}>No recurrence data available.</Text>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 12 }}
              >
                <View style={{ width: effectiveWidth, height: TIMELINE_H }}>
                  {/* Year labels */}
                  {years.map(y => {
                    const x = ((new Date(`${y}-01-01T00:00:00`).getTime() - startMs) / totalMs) * effectiveWidth
                    return (
                      <Text key={y} style={[s.yearLabel, { position: 'absolute', left: x - 18, top: 0, width: 36, textAlign: 'center' }]}>
                        {y}
                      </Text>
                    )
                  })}
                  {/* Horizontal line */}
                  <View style={[s.timelineLine, { top: LINE_Y, width: effectiveWidth }]} />
                  {/* Dots */}
                  {spot.timelineEvents.map((ev, i) => (
                    <View
                      key={i}
                      style={[s.dot, {
                        left:            adjX[i] - DOT_R,
                        top:             LINE_Y - DOT_R,
                        width:           DOT_R * 2,
                        height:          DOT_R * 2,
                        backgroundColor: ev.eventType === 'resolved' ? D.green : D.red,
                      }]}
                    />
                  ))}
                </View>
              </ScrollView>
              {/* Legend */}
              <View style={s.legendRow}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: D.green }]} />
                  <Text style={s.legendText}>Resolved</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: D.red }]} />
                  <Text style={s.legendText}>Reported again</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Recent activity */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Recent Activity</Text>
          {spot.recentActivity.length === 0 ? (
            <Text style={[s.emptyText, { marginTop: 10 }]}>No recent activity.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {spot.recentActivity.map((record, i) => {
                const isLast    = i === spot.recentActivity.length - 1
                const stColor   = record.status === 'Closed' ? D.green
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
                      <Text style={s.activityResolution}>{resolution}</Text>
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

  // Back
  backRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 12 },
  backArrow: { color: D.text1, fontSize: 26, fontWeight: '300', lineHeight: 30 },
  backLabel: { color: D.text2, fontSize: 15, fontWeight: '600' },

  // Title card
  titleCard:    { backgroundColor: D.surface, borderRadius: 14, padding: 16, marginBottom: 12 },
  titleRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox:      { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconText:     { fontSize: 22 },
  titleText:    { color: D.text1, fontSize: 22, fontWeight: '800' },
  locationText: { color: D.text2, fontSize: 13 },
  badge:        { marginTop: 5, alignSelf: 'flex-start', backgroundColor: D.surfaceHigh, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:    { color: D.text2, fontSize: 10, fontWeight: '600' },

  // Stats
  statsRow:  { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard:  { flex: 1, backgroundColor: D.surface, borderRadius: 14, padding: 12, gap: 4 },
  statLabel: { color: D.text2, fontSize: 11, fontWeight: '600' },
  statValue: { color: D.text1, fontSize: 18, fontWeight: '800' },

  // Section card
  sectionCard:  { backgroundColor: D.surface, borderRadius: 14, padding: 14, marginBottom: 12 },
  sectionTitle: { color: D.text1, fontSize: 16, fontWeight: '700' },
  emptyText:    { color: D.text2, fontSize: 13 },

  // Timeline
  yearLabel:    { color: D.text3, fontSize: 10, fontWeight: '600' },
  timelineLine: { position: 'absolute', height: 1, backgroundColor: D.border },
  dot:          { position: 'absolute', borderRadius: 99 },
  legendRow:    { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:    { width: 8, height: 8, borderRadius: 99 },
  legendText:   { color: D.text2, fontSize: 11 },

  // Recent activity
  activityRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  activityDate:       { color: D.text1, fontSize: 13, fontWeight: '500', flex: 1 },
  statusBadge:        { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusText:         { fontSize: 11, fontWeight: '700' },
  activityResolution: { color: D.text2, fontSize: 12, minWidth: 52, textAlign: 'right' },
  rowDivider:         { height: 1, backgroundColor: D.border },
})
