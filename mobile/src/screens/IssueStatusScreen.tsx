import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SampleIssueImage } from '../components/SampleIssueImage'

import { dashboard311 } from '../data/dashboard311'
import { ReportRecord, SampleIssueRecord } from '../types'

const CATEGORY_ICON: Record<string, string> = {
  'Pothole':             'road-variant',
  'Streetlight Outage':  'lightbulb-on-outline',
  'Graffiti':            'format-paint',
  'Illegal Dumping':     'trash-can-outline',
  'Vehicle Concerns':    'car',
  'Encampment Concerns': 'tent',
}

const CATEGORY_COLOR: Record<string, string> = {
  'Pothole':             '#E8514A',
  'Streetlight Outage':  '#5B9BF8',
  'Graffiti':            '#3ECF82',
  'Illegal Dumping':     '#F0A030',
  'Vehicle Concerns':    '#E8514A',
  'Encampment Concerns': '#A78BFA',
}

type IssueStatusScreenProps = {
  report: ReportRecord | SampleIssueRecord
  onBack: () => void
  onToggleFollow: () => void
  primaryActionLabel?: string
  onPrimaryAction?: () => void
}

export const IssueStatusScreen = ({
  report,
  onBack,
  onToggleFollow,
  primaryActionLabel,
  onPrimaryAction,
}: IssueStatusScreenProps) => {
  const isSampleIssue = 'image' in report
  const coordinatesText = isSampleIssue
    ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`
    : null

  const d3IssueTypes = dashboard311.districts['3']?.issueTypes ?? []
  const issueMetrics = d3IssueTypes.find(t => t.name === report.category)

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.issueId}>{report.id}</Text>
            <Text style={styles.issueTitle}>{report.title}</Text>
          </View>
        </View>

        <View style={styles.photoCard}>
          {'image' in report ? (
            <SampleIssueImage image={report.image} style={{ width: '100%', height: '100%' }} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialCommunityIcons
                name={(CATEGORY_ICON[report.category] ?? 'alert-circle-outline') as any}
                size={44}
                color={CATEGORY_COLOR[report.category] ?? '#8D939E'}
              />
              <Text style={styles.photoPlaceholderLabel}>{report.category}</Text>
            </View>
          )}
          <View style={styles.photoOverlay}>
            <Text style={styles.photoOverlayText}>{report.photoCount} photo{report.photoCount === 1 ? '' : 's'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapArea}>
            <Image source={require('../../assets/new-map.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <View
              style={[
                styles.mapPin,
                {
                  top: `${report.pin.top}%`,
                  left: `${report.pin.left}%`,
                  backgroundColor: report.pin.color,
                },
              ]}
            />
          </View>
          <Text style={styles.value}>{isSampleIssue ? report.locationName : report.address}</Text>
          <Text style={styles.secondaryValue}>{report.address}</Text>
          {coordinatesText ? <Text style={styles.metaValue}>Coordinates: {coordinatesText}</Text> : null}
          <View style={styles.tagRow}>
            <InfoPill label={report.district} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.bodyText}>{report.description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          {report.timeline.map((entry, index) => (
            <View key={`${entry.label}-${index}`} style={styles.timelineRow}>
              <View style={[styles.dot, entry.reached ? styles.dotReached : styles.dotPending]} />
              <View style={styles.timelineTextWrap}>
                <Text style={styles.timelineLabel}>{entry.label}</Text>
                <Text style={styles.timelineDate}>{entry.dateText}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <InsightRow
            label="Avg. resolution time"
            value={issueMetrics ? issueMetrics.all.avgTimeLabel : report.estimatedResolution}
          />
          <InsightRow
            label="Resolution rate"
            value={issueMetrics
              ? `${issueMetrics.all.resolvedPct}% of District 3 cases resolved`
              : `${report.reportCount} ${report.reportCount === 1 ? 'person' : 'people'} reported or confirmed this issue`}
          />
          <InsightRow label="Assigned team" value={report.assignedTo} />
        </View>

        <View style={styles.actionRow}>
          {primaryActionLabel && onPrimaryAction ? (
            <Pressable
              style={styles.followButton}
              onPress={onPrimaryAction}
              accessibilityRole="button"
            >
              <Text style={styles.followButtonText}>{primaryActionLabel}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.followButton, report.isFollowing ? styles.followButtonActive : null]}
              onPress={onToggleFollow}
              accessibilityRole="button"
            >
              <Text style={[styles.followButtonText, report.isFollowing ? styles.followButtonTextActive : null]}>
                {report.isFollowing ? 'Following for updates' : 'Follow this issue'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const InsightRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <View style={styles.insightRow}>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={styles.insightValue}>{value}</Text>
    </View>
  )
}

const InfoPill = ({ label }: { label: string }) => {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillText}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#18191C' },
  content: { padding: 14, gap: 14, paddingBottom: 32 },
  headingRow: { gap: 10 },
  headingCopy: { gap: 6 },
  issueId: { fontSize: 13, fontWeight: '700', color: '#8D939E', letterSpacing: 0.4 },
  issueTitle: { fontSize: 24, fontWeight: '900', color: '#F2F3F5', lineHeight: 30 },
  badge: {
    backgroundColor: '#F0A03028',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeResolved: {
    backgroundColor: '#4F8EF728',
  },
  badgeText: { color: '#F0A030', fontWeight: '700' },
  badgeTextResolved: { color: '#4F8EF7' },
  photoCard: {
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2C2D32',
  },
  photoOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(17,24,39,0.8)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoOverlayText: {
    color: '#F2F3F5',
    fontWeight: '700',
    fontSize: 12,
  },
  card: { borderRadius: 16, backgroundColor: '#222428', padding: 14, gap: 10 },
  sectionTitle: { color: '#F2F3F5', fontWeight: '800', fontSize: 18 },
  mapArea: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#2C2D32',
  },
  mapPin: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  value: { color: '#F2F3F5', fontWeight: '700', fontSize: 16, lineHeight: 22 },
  secondaryValue: { color: '#8D939E', fontWeight: '500', lineHeight: 21 },
  metaValue: { color: '#8D939E', fontWeight: '600', fontSize: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoPill: {
    backgroundColor: '#2C2D32',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoPillText: { color: '#8D939E', fontWeight: '700', fontSize: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineTextWrap: { flex: 1, gap: 2 },
  dot: { width: 12, height: 12, borderRadius: 999, marginTop: 6 },
  dotReached: { backgroundColor: '#4F8EF7' },
  dotPending: { backgroundColor: '#35373D' },
  timelineLabel: { fontSize: 16, fontWeight: '700', color: '#F2F3F5' },
  timelineDate: { color: '#8D939E', fontWeight: '500', lineHeight: 20 },
  bodyText: { color: '#8D939E', lineHeight: 22, fontWeight: '500' },
  insightRow: { gap: 4 },
  insightLabel: { color: '#8D939E', fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  insightValue: { color: '#F2F3F5', fontWeight: '600', lineHeight: 22 },
  actionRow: { gap: 10 },
  followButton: {
    borderRadius: 14,
    backgroundColor: '#4F8EF7',
    paddingVertical: 16,
    alignItems: 'center',
  },
  followButtonActive: {
    backgroundColor: '#2C2D32',
    borderWidth: 1,
    borderColor: '#35373D',
  },
  followButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  followButtonTextActive: { color: '#F2F3F5' },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#35373D',
  },
  closeButton: {
    backgroundColor: '#2C2D32',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: '#8D939E', fontSize: 14, fontWeight: '600' },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#2C2D32',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  photoPlaceholderLabel: {
    color: '#8D939E',
    fontSize: 13,
    fontWeight: '600',
  },
})
