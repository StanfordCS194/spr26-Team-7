import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { MockStreetPhoto } from '../components/MockStreetPhoto'
import { WireframeHeader } from '../components/WireframeHeader'
import { T } from '../theme'
import { ReportRecord } from '../types'

type IssueStatusScreenProps = {
  report: ReportRecord
  onBack: () => void
  onToggleFollow: () => void
  onAddPhoto: () => void
}

export const IssueStatusScreen = ({
  report,
  onBack,
  onToggleFollow,
  onAddPhoto,
}: IssueStatusScreenProps) => {
  return (
    <View style={styles.page}>
      <WireframeHeader title="Issue" showBack onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.issueId}>{report.id}</Text>
            <Text style={styles.issueTitle}>{report.title}</Text>
          </View>
          <View style={[styles.badge, report.status === 'Resolved' ? styles.badgeResolved : null]}>
            <Text style={[styles.badgeText, report.status === 'Resolved' ? styles.badgeTextResolved : null]}>
              {report.status}
            </Text>
          </View>
        </View>

        <View style={styles.photoCard}>
          <MockStreetPhoto style={{ width: '100%', height: '100%' }} />
          <View style={styles.photoOverlay}>
            <Text style={styles.photoOverlayText}>{report.photoCount} photo{report.photoCount === 1 ? '' : 's'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapArea}>
            <Image source={require('../../assets/new-map.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <View style={styles.mapPin} />
          </View>
          <Text style={styles.value}>{report.address}</Text>
          <View style={styles.tagRow}>
            <InfoPill label={report.category} />
            <InfoPill label={report.tag} />
            <InfoPill label={report.district} />
          </View>
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
          <InsightRow label="Estimated resolution time" value={report.estimatedResolution} />
          <InsightRow
            label="Reports and confirmations"
            value={`${report.reportCount} people reported or confirmed this issue`}
          />
          <InsightRow label="Assigned team" value={report.assignedTo} />
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.followButton, report.isFollowing ? styles.followButtonActive : null]}
            onPress={onToggleFollow}
            accessibilityRole="button"
          >
            <Text style={[styles.followButtonText, report.isFollowing ? styles.followButtonTextActive : null]}>
              {report.isFollowing ? 'Following for updates' : 'Follow this issue'}
            </Text>
          </Pressable>

          {report.isUserOwned ? (
            <Pressable style={styles.secondaryButton} onPress={onAddPhoto} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>Add photo or update</Text>
            </Pressable>
          ) : null}
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
  page: { flex: 1, backgroundColor: T.white },
  content: { padding: 14, gap: 14, paddingBottom: 32 },
  headingRow: { gap: 10 },
  headingCopy: { gap: 6 },
  issueId: { fontSize: 13, fontWeight: '700', color: T.ink3, letterSpacing: 0.4 },
  issueTitle: { fontSize: 24, fontWeight: '900', color: T.ink, lineHeight: 30 },
  badge: {
    backgroundColor: '#FFF2BF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeResolved: {
    backgroundColor: T.greenLight,
  },
  badgeText: { color: '#6C5600', fontWeight: '700' },
  badgeTextResolved: { color: T.green },
  photoCard: {
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#D7DEE9',
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
    color: T.white,
    fontWeight: '700',
    fontSize: 12,
  },
  card: { borderRadius: 16, borderWidth: 1, borderColor: '#E2E9F1', padding: 14, gap: 10 },
  sectionTitle: { color: T.ink, fontWeight: '800', fontSize: 18 },
  mapArea: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#EDF2F8',
  },
  mapPin: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F08B00',
    borderWidth: 2,
    borderColor: '#fff',
    top: '28%',
    left: '22%',
  },
  value: { color: T.ink, fontWeight: '700', fontSize: 16, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoPill: {
    backgroundColor: T.warm,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoPillText: { color: T.ink2, fontWeight: '700', fontSize: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineTextWrap: { flex: 1, gap: 2 },
  dot: { width: 12, height: 12, borderRadius: 999, marginTop: 6 },
  dotReached: { backgroundColor: T.blue },
  dotPending: { backgroundColor: T.ink4 },
  timelineLabel: { fontSize: 16, fontWeight: '700', color: T.ink },
  timelineDate: { color: '#667287', fontWeight: '500', lineHeight: 20 },
  insightRow: { gap: 4 },
  insightLabel: { color: T.ink3, fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  insightValue: { color: T.ink, fontWeight: '600', lineHeight: 22 },
  actionRow: { gap: 10 },
  followButton: {
    borderRadius: 14,
    backgroundColor: T.blue,
    paddingVertical: 16,
    alignItems: 'center',
  },
  followButtonActive: {
    backgroundColor: T.blueLight,
    borderWidth: 1,
    borderColor: '#C7DBFF',
  },
  followButtonText: { color: T.white, fontWeight: '800', fontSize: 16 },
  followButtonTextActive: { color: T.blueDark },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: T.ink,
    fontWeight: '800',
    fontSize: 16,
  },
})
