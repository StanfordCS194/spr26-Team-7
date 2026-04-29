import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ReportRecord } from '../types'
import { WireframeHeader } from '../components/WireframeHeader'

type IssueStatusScreenProps = {
  report: ReportRecord
  onBack: () => void
}

export const IssueStatusScreen = ({ report, onBack }: IssueStatusScreenProps) => {
  return (
    <View style={styles.page}>
      <WireframeHeader title="Status" showBack onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <Text style={styles.issueId}>Issue #{report.id}</Text>
          <Text style={styles.share}>⤴</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{report.status}</Text>
        </View>
        <View style={styles.photoArea}>
          <Image
            source={require('../../assets/pothole.jpg')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.mapArea}>
            <Image
              source={require('../../assets/SJMap-hardcode.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <View style={styles.mapPin} />
          </View>
          <Text style={styles.value}>{report.address}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Issue Type</Text>
          <Text style={styles.value}>{report.category}</Text>
          <Text style={styles.label}>Assigned To</Text>
          <Text style={styles.value}>{report.assignedTo}</Text>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{report.description}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.timelineTitle}>Status Timeline</Text>
          {report.timeline.map((entry, index) => (
            <View key={`${entry.label}-${index}`} style={styles.timelineRow}>
              <View style={[styles.dot, index === 1 ? styles.activeDot : null]} />
              <View>
                <Text style={styles.timelineLabel}>{entry.label}</Text>
                <Text style={styles.timelineDate}>{entry.dateText}</Text>
              </View>
            </View>
          ))}
        </View>
        <Pressable style={styles.followButton} accessibilityRole="button">
          <Text style={styles.followButtonText}>Follow This Issue</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 14, gap: 14, paddingBottom: 32 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  issueId: { fontSize: 44 / 2, fontWeight: '800' },
  share: { fontSize: 22, color: '#4D5A72' },
  badge: {
    backgroundColor: '#FFF2BF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: '#6C5600', fontWeight: '700' },
  photoArea: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  card: { borderRadius: 14, borderWidth: 1, borderColor: '#E2E9F1', padding: 12, gap: 8 },
  label: { color: '#4E5A6E', fontWeight: '600', marginTop: 6, fontSize: 28 / 2 },
  value: { color: '#151B28', fontWeight: '700', fontSize: 36 / 2 },
  mapArea: {
    height: 230,
    borderRadius: 10,
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
  timelineTitle: { fontWeight: '800', fontSize: 36 / 2, marginBottom: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#1F6DFF', marginTop: 7 },
  activeDot: { backgroundColor: '#BD8A00' },
  timelineLabel: { fontSize: 34 / 2, fontWeight: '700' },
  timelineDate: { color: '#667287', fontWeight: '500' },
  followButton: {
    marginTop: 2,
    borderRadius: 12,
    backgroundColor: '#1565FF',
    paddingVertical: 16,
    alignItems: 'center',
  },
  followButtonText: { color: '#fff', fontWeight: '800', fontSize: 34 / 2 },
})
