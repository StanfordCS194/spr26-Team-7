import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { WireframeHeader } from '../components/WireframeHeader'
import {
  formatAccountAge,
  formatReportDate,
  formatReportStatus,
  getProfileImpactStats,
  ProfileReport,
} from '../lib/profileStats'

type ProfileScreenProps = {
  isSignedIn: boolean
  onToggleAuth: () => void
  onOpenSettings: () => void
  displayName?: string | null
  email?: string | null
  memberSince?: string | null
  reports: ProfileReport[]
  followingReports: ProfileReport[]
  onViewReport: (reportId: string) => void
}

const SectionTitle = ({
  icon,
  title,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  title: string
}) => (
  <View style={styles.sectionTitleRow}>
    <View style={styles.sectionIconBox}>
      <MaterialCommunityIcons name={icon} size={18} color="#4F8EF7" />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
  </View>
)

const ReportList = ({
  reports,
  emptyMessage,
  onViewReport,
}: {
  reports: ProfileReport[]
  emptyMessage: string
  onViewReport: (reportId: string) => void
}) => {
  const sortedReports = [...reports].sort(
    (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
  )

  if (sortedReports.length === 0) {
    return <Text style={styles.mutedText}>{emptyMessage}</Text>
  }

  return sortedReports.map((report) => (
    <Pressable
      key={report.id}
      onPress={() => onViewReport(report.id)}
      style={styles.reportRow}
      accessibilityRole="button"
      accessibilityLabel={`View report: ${report.title}`}
    >
      <View style={styles.reportCopy}>
        <Text style={styles.reportTitle}>{report.title}</Text>
        <Text style={styles.reportMeta}>
          {`${report.category} · ${formatReportStatus(report.status)} · ${formatReportDate(report.submittedAt)}`}
        </Text>
      </View>
      <Text style={styles.reportChevron}>›</Text>
    </Pressable>
  ))
}

export const ProfileScreen = ({
  isSignedIn,
  onToggleAuth,
  onOpenSettings,
  displayName,
  email,
  memberSince,
  reports,
  followingReports,
  onViewReport,
}: ProfileScreenProps) => {
  const { totalSubmitted, resolved } = getProfileImpactStats(reports)
  const accountAge = memberSince ? formatAccountAge(memberSince) : 'Unknown'

  return (
    <View style={styles.page}>
      <WireframeHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        {!isSignedIn ? (
          <View style={styles.card}>
            <Text style={styles.promptTitle}>Use app without login, or sign in for history and follows.</Text>
            <Pressable style={styles.primaryButton} onPress={onToggleAuth} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>Log In</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <SectionTitle icon="account-outline" title="Account" />
              {displayName ? <Text style={styles.bodyText}>{displayName}</Text> : null}
              {email ? <Text style={styles.mutedText}>{email}</Text> : null}
            </View>

            <Pressable
              style={styles.settingsButton}
              onPress={onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <View style={styles.settingsLeft}>
                <View style={styles.sectionIconBox}>
                  <MaterialCommunityIcons name="cog-outline" size={18} color="#4F8EF7" />
                </View>
                <Text style={styles.settingsLabel}>Settings</Text>
              </View>
              <Text style={styles.reportChevron}>›</Text>
            </Pressable>

            <View style={styles.card}>
              <SectionTitle icon="chart-line" title="Personal Impact" />
              <Text style={styles.bodyText}>Total submitted: {totalSubmitted}</Text>
              <Text style={styles.bodyText}>Resolved: {resolved}</Text>
              <Text style={styles.bodyText}>Using app for: {accountAge}</Text>
            </View>
            <View style={styles.card}>
              <SectionTitle icon="clipboard-text-outline" title="My Reports" />
              <ReportList
                reports={reports}
                emptyMessage="No reports yet. File one from the Report tab."
                onViewReport={onViewReport}
              />
            </View>
            <View style={styles.card}>
              <SectionTitle icon="bookmark-outline" title="Following" />
              <ReportList
                reports={followingReports}
                emptyMessage="You are not following any reports yet."
                onViewReport={onViewReport}
              />
            </View>
            <Pressable style={styles.secondaryButton} onPress={onToggleAuth} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>Log Out</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#18191C' },
  content: { padding: 14, gap: 14, paddingBottom: 24 },
  card: {
    backgroundColor: '#222428',
    borderColor: '#35373D',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#4F8EF728',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptTitle: { color: '#8D939E', lineHeight: 22, fontSize: 16, fontWeight: '500' },
  cardTitle: { fontWeight: '800', fontSize: 17, color: '#F2F3F5' },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#222428',
    borderColor: '#35373D',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsLabel: { fontWeight: '700', fontSize: 16, color: '#F2F3F5' },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#4F8EF7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    borderColor: '#35373D',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#222428',
  },
  secondaryButtonText: { fontWeight: '700', fontSize: 16, color: '#F2F3F5' },
  bodyText: { color: '#F2F3F5', fontWeight: '500' },
  mutedText: { color: '#8D939E', fontWeight: '500' },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#35373D',
  },
  reportCopy: { flex: 1, gap: 2 },
  reportTitle: { color: '#F2F3F5', fontWeight: '700', fontSize: 15 },
  reportMeta: { color: '#8D939E', fontWeight: '500', fontSize: 13 },
  reportChevron: { color: '#8D939E', fontSize: 22, lineHeight: 24 },
})
