import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { WireframeHeader } from '../components/WireframeHeader'
import { ReportRecord } from '../types'
import { T } from '../theme'

const filters = ['Roads', 'Utilities', 'Parks', 'Transit', 'Buildings']

type DashboardScreenProps = {
  issues: ReportRecord[]
  onOpenIssue: (issueId: string) => void
}

type DashboardView = 'overview' | 'all'

export const DashboardScreen = ({ issues, onOpenIssue }: DashboardScreenProps) => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview')
  const featuredIssues = issues.slice(0, 3)

  return (
    <View style={styles.page}>
      <WireframeHeader title="Dashboard" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Downtown Neighborhood</Text>
        <Text style={styles.subtitle}>Tap a map pin or issue row to open the full issue page.</Text>

        <View style={styles.mapCard}>
          <View style={styles.mapStreetHorizontal} />
          <View style={styles.mapStreetVertical} />
          <View style={[styles.mapBlock, { top: 18, left: 14, right: 208, bottom: 134 }]} />
          <View style={[styles.mapBlock, { top: 18, left: 182, right: 82, bottom: 134 }]} />
          <View style={[styles.mapBlock, { top: 144, left: 14, right: 208, bottom: 20 }]} />
          <View style={[styles.mapBlock, { top: 144, left: 182, right: 82, bottom: 20 }]} />
          {issues.map((issue) => (
            <Pressable
              key={issue.id}
              style={[styles.pinButton, { top: issue.pin.top, left: issue.pin.left }]}
              onPress={() => onOpenIssue(issue.id)}
              accessibilityRole="button"
            >
              <View style={[styles.pinDot, { backgroundColor: issue.pin.color }]} />
              <Text style={styles.pinCount}>{issue.reportCount}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.filterRow}>
          {filters.map((filter) => (
            <Pressable key={filter} style={styles.filterPill} accessibilityRole="button">
              <Text style={styles.filterText}>{filter}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.segmentRow}>
          <Pressable
            style={[styles.segmentButton, currentView === 'overview' ? styles.segmentButtonActive : null]}
            onPress={() => setCurrentView('overview')}
            accessibilityRole="button"
          >
            <Text style={[styles.segmentText, currentView === 'overview' ? styles.segmentTextActive : null]}>
              Overview
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentButton, currentView === 'all' ? styles.segmentButtonActive : null]}
            onPress={() => setCurrentView('all')}
            accessibilityRole="button"
          >
            <Text style={[styles.segmentText, currentView === 'all' ? styles.segmentTextActive : null]}>
              All Issues
            </Text>
          </Pressable>
        </View>

        {currentView === 'overview' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Top Issues</Text>
              {featuredIssues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} onPress={() => onOpenIssue(issue.id)} />
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>This Month</Text>
              <Text style={styles.statLine}>Reported: 38</Text>
              <Text style={styles.statLine}>Resolved: 24</Text>
              <Text style={styles.statLine}>Avg resolution (potholes): 5.2 days</Text>
              <Text style={styles.statLine}>Trending spike: streetlight outages (+42%)</Text>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>All Issues</Text>
            {issues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} onPress={() => onOpenIssue(issue.id)} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const IssueRow = ({ issue, onPress }: { issue: ReportRecord; onPress: () => void }) => {
  return (
    <Pressable style={styles.issueRow} onPress={onPress} accessibilityRole="button">
      <View style={styles.issueRowTop}>
        <Text style={styles.issueTitle}>{issue.title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{issue.reportCount}</Text>
        </View>
      </View>
      <Text style={styles.issueMeta}>
        {issue.category} · {issue.tag} · {issue.status}
      </Text>
      <Text style={styles.issueMeta}>
        {issue.address}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.white },
  content: { padding: 14, gap: 14, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: T.ink },
  subtitle: { color: '#69768A', fontWeight: '500' },
  mapCard: {
    height: 220,
    borderRadius: 16,
    backgroundColor: '#EBF0F6',
    overflow: 'hidden',
    position: 'relative',
  },
  mapStreetHorizontal: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: '#F7FAFD',
  },
  mapStreetVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 130,
    width: 18,
    backgroundColor: '#F7FAFD',
  },
  mapBlock: {
    position: 'absolute',
    backgroundColor: '#D8E2EF',
    borderRadius: 12,
  },
  pinButton: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#D7E1EE',
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
  pinCount: {
    color: T.ink,
    fontWeight: '800',
    fontSize: 12,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterPill: {
    borderColor: '#9EC0F7',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F7FF',
  },
  filterText: { color: '#2457AE', fontWeight: '700', fontSize: 13 },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: T.blueLight,
    borderRadius: 16,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: T.white,
  },
  segmentText: {
    color: T.ink2,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: T.blueDark,
  },
  card: { borderColor: '#E3EAF2', borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  cardTitle: { fontWeight: '800', fontSize: 17, color: T.ink },
  issueRow: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  issueRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  issueTitle: {
    flex: 1,
    color: T.ink,
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 21,
  },
  countBadge: {
    backgroundColor: T.blueLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    color: T.blueDark,
    fontWeight: '800',
    fontSize: 12,
  },
  issueMeta: {
    color: '#506079',
    lineHeight: 20,
    fontWeight: '500',
  },
  statLine: { color: '#2D3850', lineHeight: 21, fontWeight: '500' },
})
